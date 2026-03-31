<?php
/**
 * Plugin Name: WooCommerce Extensions API
 * Description: Custom REST API endpoints and database tables for price tracking, AI pricing suggestions, and notifications.
 * Version: 1.0.0
 * Author: Your Store
 * License: MIT
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('WCE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('WCE_PLUGIN_URL', plugin_dir_url(__FILE__));
define('WCE_TABLE_PREFIX', $wpdb->prefix . 'wc_');

class WooCommerceExtensions {
    private static $instance = null;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('init', [$this, 'init']);
        add_action('rest_api_init', [$this, 'register_routes']);
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
    }

    public function init() {
        // Initialize any needed components
    }

    public function activate() {
        $this->create_tables();

        // Generate cron secret if not set
        if (!get_option('wce_cron_secret')) {
            $secret = wp_generate_password(32, false);
            update_option('wce_cron_secret', $secret);
        }

        // Set default settings
        $defaults = [
            'wce_price_check_interval' => '6',
            'wce_alert_threshold_price' => '10',
            'wce_low_stock_threshold' => '10',
            'wce_enable_whatsapp' => '0',
            'wce_ai_confidence_threshold' => '85',
        ];
        foreach ($defaults as $key => $value) {
            if (get_option($key, false) === false) {
                update_option($key, $value);
            }
        }
    }

    public function deactivate() {
        // Clean up if needed
    }

    private function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        // Price History Table
        $table_price_history = $wpdb->prefix . 'wc_price_history';
        $sql_price_history = "
            CREATE TABLE IF NOT EXISTS $table_price_history (
                id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                product_id BIGINT(20) UNSIGNED NOT NULL,
                old_price DECIMAL(10,2),
                new_price DECIMAL(10,2),
                competitor_name VARCHAR(255),
                competitor_url TEXT,
                competitor_price DECIMAL(10,2),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY product_id (product_id),
                KEY created_at (created_at),
                FOREIGN KEY (product_id) REFERENCES {$wpdb->posts}(ID) ON DELETE CASCADE
            ) $charset_collate;
        ";

        // AI Suggestions Table
        $table_ai_suggestions = $wpdb->prefix . 'wc_ai_suggestions';
        $sql_ai_suggestions = "
            CREATE TABLE IF NOT EXISTS $table_ai_suggestions (
                id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                product_id BIGINT(20) UNSIGNED NOT NULL,
                suggested_price DECIMAL(10,2),
                current_price DECIMAL(10,2),
                confidence_score DECIMAL(3,2),
                reasoning LONGTEXT,
                price_positioning VARCHAR(50),
                expected_impact TEXT,
                is_applied TINYINT(1) DEFAULT 0,
                applied_at DATETIME NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY product_id (product_id),
                KEY is_applied (is_applied),
                FOREIGN KEY (product_id) REFERENCES {$wpdb->posts}(ID) ON DELETE CASCADE
            ) $charset_collate;
        ";

        // Notifications Table
        $table_notifications = $wpdb->prefix . 'wc_notifications';
        $sql_notifications = "
            CREATE TABLE IF NOT EXISTS $table_notifications (
                id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
                user_id BIGINT(20) UNSIGNED,
                type ENUM('email', 'whatsapp', 'in_app') NOT NULL,
                channel VARCHAR(100),
                title VARCHAR(255) NOT NULL,
                body TEXT NOT NULL,
                status ENUM('pending', 'sent', 'failed', 'read') DEFAULT 'pending',
                scheduled_for DATETIME,
                sent_at DATETIME NULL,
                attempts INT DEFAULT 0,
                error_message TEXT NULL,
                metadata LONGTEXT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                KEY user_id (user_id),
                KEY status (status),
                KEY scheduled_for (scheduled_for)
            ) $charset_collate;
        ";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql_price_history);
        dbDelta($sql_ai_suggestions);
        dbDelta($sql_notifications);
    }

    public function register_routes() {
        // Price History
        register_rest_route('wc-extensions/v1', '/price-history', [
            'methods' => 'POST',
            'callback' => [$this, 'add_price_history'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route('wc-extensions/v1', '/price-history/(?P<product_id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_price_history'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        // AI Suggestions
        register_rest_route('wc-extensions/v1', '/ai-suggestions', [
            'methods' => 'POST',
            'callback' => [$this, 'create_ai_suggestion'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route('wc-extensions/v1', '/ai-suggestions', [
            'methods' => 'GET',
            'callback' => [$this, 'get_ai_suggestions'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route('wc-extensions/v1', '/ai-suggestions/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_ai_suggestion'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        // Notifications
        register_rest_route('wc-extensions/v1', '/notifications', [
            'methods' => 'POST',
            'callback' => [$this, 'create_notification'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route('wc-extensions/v1', '/notifications', [
            'methods' => 'GET',
            'callback' => [$this, 'get_notifications'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route('wc-extensions/v1', '/notifications/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'update_notification'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route('wc-extensions/v1', '/notifications/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'delete_notification'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        // Settings (using wp_options)
        register_rest_route('wc-extensions/v1', '/settings', [
            'methods' => 'GET',
            'callback' => [$this, 'get_settings'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route('wc-extensions/v1', '/settings', [
            'methods' => 'POST',
            'callback' => [$this, 'update_settings'],
            'permission_callback' => [$this, 'check_permission'],
        ]);
    }

    public function check_permission(WP_REST_Request $request) {
        // Check for Cron Secret (for server-to-server calls)
        $cron_secret = $request->get_header('X-Cron-Secret');
        if ($cron_secret && $cron_secret === get_option('wce_cron_secret', '')) {
            return true;
        }

        // Check for Application Password / API Key
        // Accept either logged-in user with proper caps OR WooCommerce REST API auth
        if (is_user_logged_in()) {
            return current_user_can('manage_woocommerce') || current_user_can('edit_posts');
        }

        // Check for WooCommerce REST API authentication (Basic Auth: ck:cs)
        $auth_header = $request->get_header('Authorization');
        if ($auth_header && stripos($auth_header, 'Basic ') === 0) {
            $credentials = base64_decode(substr($auth_header, 6));
            if ($credentials && strpos($credentials, ':') !== false) {
                list($consumer_key, $consumer_secret) = explode(':', $credentials, 2);
                if ($this->verify_wc_api_credentials($consumer_key, $consumer_secret)) {
                    return true;
                }
            }
        }

        // Also check for consumer key/secret in query params (for GET requests)
        $consumer_key = $request->get_param('consumer_key');
        $consumer_secret = $request->get_param('consumer_secret');
        if ($consumer_key && $consumer_secret) {
            if ($this->verify_wc_api_credentials($consumer_key, $consumer_secret)) {
                return true;
            }
        }

        return false;
    }

    private function verify_wc_api_credentials($key, $secret) {
        global $wpdb;

        // WooCommerce stores API keys in wp_woocommerce_api_keys table
        $table = $wpdb->prefix . 'woocommerce_api_keys';
        $user_id = get_current_user_id();

        $result = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table WHERE consumer_key = %s AND consumer_secret = %s AND permissions LIKE %s",
                $key,
                $secret,
                '%read%'
            )
        );

        return $result !== null;
    }

    // Price History Methods
    public function add_price_history(WP_REST_Request $request) {
        global $wpdb;

        $params = $request->get_params();
        $table = $wpdb->prefix . 'wc_price_history';

        $result = $wpdb->insert(
            $table,
            [
                'product_id' => intval($params['product_id']),
                'old_price' => floatval($params['old_price']),
                'new_price' => floatval($params['new_price']),
                'competitor_name' => sanitize_text_field($params['competitor_name']),
                'competitor_url' => esc_url_raw($params['competitor_url'] ?? ''),
                'competitor_price' => floatval($params['competitor_price']),
                'created_at' => current_time('mysql'),
            ],
            ['%d', '%f', '%f', '%s', '%s', '%f', '%s']
        );

        if ($result === false) {
            return new WP_REST_Response(['error' => 'Failed to add price history'], 500);
        }

        return new WP_REST_Response(['id' => $wpdb->insert_id, 'message' => 'Price history added'], 201);
    }

    public function get_price_history(WP_REST_Request $request) {
        global $wpdb;
        $product_id = intval($request->get_param('product_id'));
        $table = $wpdb->prefix . 'wc_price_history';

        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table WHERE product_id = %d ORDER BY created_at DESC LIMIT 100",
                $product_id
            )
        );

        return new WP_REST_Response($results, 200);
    }

    // AI Suggestions Methods
    public function create_ai_suggestion(WP_REST_Request $request) {
        global $wpdb;

        $params = $request->get_params();
        $table = $wpdb->prefix . 'wc_ai_suggestions';

        $result = $wpdb->insert(
            $table,
            [
                'product_id' => intval($params['product_id']),
                'suggested_price' => floatval($params['suggested_price']),
                'current_price' => floatval($params['current_price']),
                'confidence_score' => floatval($params['confidence_score']),
                'reasoning' => wp_json_encode($params['reasoning'] ?? []),
                'price_positioning' => sanitize_text_field($params['price_positioning']),
                'expected_impact' => sanitize_textarea_field($params['expected_impact'] ?? ''),
                'is_applied' => 0,
                'created_at' => current_time('mysql'),
            ],
            ['%d', '%f', '%f', '%f', '%s', '%s', '%s', '%d', '%s']
        );

        if ($result === false) {
            return new WP_REST_Response(['error' => 'Failed to create suggestion'], 500);
        }

        return new WP_REST_Response(['id' => $wpdb->insert_id, 'message' => 'Suggestion created'], 201);
    }

    public function get_ai_suggestions(WP_REST_Request $request) {
        global $wpdb;
        $table = $wpdb->prefix . 'wc_ai_suggestions';

        $limit = intval($request->get_param('per_page') ?? 20);
        $page = intval($request->get_param('page') ?? 1);
        $offset = ($page - 1) * $limit;

        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT s.*, p.post_title as product_name, p.post_status as product_status
                 FROM $table s
                 LEFT JOIN {$wpdb->posts} p ON s.product_id = p.ID
                 ORDER BY s.created_at DESC
                 LIMIT %d OFFSET %d",
                $limit, $offset
            )
        );

        $total = $wpdb->get_var("SELECT COUNT(*) FROM $table");

        return new WP_REST_Response([
            'suggestions' => $results,
            'total' => intval($total),
            'page' => $page,
            'per_page' => $limit,
        ], 200);
    }

    public function update_ai_suggestion(WP_REST_Request $request) {
        global $wpdb;
        $id = intval($request->get_param('id'));
        $table = $wpdb->prefix . 'wc_ai_suggestions';

        $params = $request->get_params();
        $update_data = [];

        if (isset($params['is_applied'])) {
            $update_data['is_applied'] = intval($params['is_applied']);
            if ($params['is_applied']) {
                $update_data['applied_at'] = current_time('mysql');
            }
        }

        if (empty($update_data)) {
            return new WP_REST_Response(['error' => 'No data to update'], 400);
        }

        $result = $wpdb->update(
            $table,
            $update_data,
            ['id' => $id],
            array_fill(0, count($update_data), is_int(reset($update_data)) ? '%d' : '%s'),
            ['%d']
        );

        if ($result === false) {
            return new WP_REST_Response(['error' => 'Failed to update suggestion'], 500);
        }

        return new WP_REST_Response(['message' => 'Suggestion updated'], 200);
    }

    // Notifications Methods
    public function create_notification(WP_REST_Request $request) {
        global $wpdb;

        $params = $request->get_params();
        $table = $wpdb->prefix . 'wc_notifications';

        $result = $wpdb->insert(
            $table,
            [
                'user_id' => intval($params['user_id'] ?? 0) ?: null,
                'type' => sanitize_text_field($params['type']),
                'channel' => sanitize_text_field($params['channel'] ?? ''),
                'title' => sanitize_text_field($params['title']),
                'body' => $params['body'],
                'status' => sanitize_text_field($params['status'] ?? 'pending'),
                'scheduled_for' => $params['scheduled_for'] ?: null,
                'metadata' => wp_json_encode($params['metadata'] ?? []),
                'created_at' => current_time('mysql'),
            ],
            ['%d', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s']
        );

        if ($result === false) {
            return new WP_REST_Response(['error' => 'Failed to create notification'], 500);
        }

        return new WP_REST_Response(['id' => $wpdb->insert_id, 'message' => 'Notification created'], 201);
    }

    public function get_notifications(WP_REST_Request $request) {
        global $wpdb;
        $table = $wpdb->prefix . 'wc_notifications';

        $limit = intval($request->get_param('per_page') ?? 20);
        $page = intval($request->get_param('page') ?? 1);
        $offset = ($page - 1) * $limit;
        $status = $request->get_param('status');

        $where = [];
        $where_args = [];

        if ($status) {
            $where[] = 'status = %s';
            $where_args[] = $status;
        }

        $where_clause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table $where_clause ORDER BY created_at DESC LIMIT %d OFFSET %d",
                array_merge($where_args, [$limit, $offset])
            )
        );

        $total_query = "SELECT COUNT(*) FROM $table" . ($where_clause ? " $where_clause" : "");
        $total = $wpdb->get_var($where_args ? $wpdb->prepare($total_query, $where_args) : $total_query);

        return new WP_REST_Response([
            'notifications' => $results,
            'total' => intval($total),
            'page' => $page,
            'per_page' => $limit,
        ], 200);
    }

    public function update_notification(WP_REST_Request $request) {
        global $wpdb;
        $id = intval($request->get_param('id'));
        $table = $wpdb->prefix . 'wc_notifications';

        $params = $request->get_params();
        $update_data = [];

        if (isset($params['status'])) {
            $update_data['status'] = sanitize_text_field($params['status']);
            if ($params['status'] === 'sent') {
                $update_data['sent_at'] = current_time('mysql');
            }
        }

        if (isset($params['error_message'])) {
            $update_data['error_message'] = $params['error_message'];
        }

        if (isset($params['attempts'])) {
            $update_data['attempts'] = intval($params['attempts']);
        }

        if (empty($update_data)) {
            return new WP_REST_Response(['error' => 'No data to update'], 400);
        }

        $result = $wpdb->update(
            $table,
            $update_data,
            ['id' => $id],
            array_fill(0, count($update_data), is_int(reset($update_data)) ? '%d' : '%s'),
            ['%d']
        );

        if ($result === false) {
            return new WP_REST_Response(['error' => 'Failed to update notification'], 500);
        }

        return new WP_REST_Response(['message' => 'Notification updated'], 200);
    }

    public function delete_notification(WP_REST_Request $request) {
        global $wpdb;
        $id = intval($request->get_param('id'));
        $table = $wpdb->prefix . 'wc_notifications';

        $result = $wpdb->delete($table, ['id' => $id], ['%d']);

        if ($result === false) {
            return new WP_REST_Response(['error' => 'Failed to delete notification'], 500);
        }

        return new WP_REST_Response(['message' => 'Notification deleted'], 200);
    }

    // Settings Methods
    public function get_settings(WP_REST_Request $request) {
        $options = [
            'wce_price_check_interval',
            'wce_competitor_websites',
            'wce_alert_threshold_price',
            'wce_low_stock_threshold',
            'wce_notification_emails',
            'wce_enable_whatsapp',
            'wce_ai_confidence_threshold',
        ];

        $settings = [];
        foreach ($options as $option) {
            $settings[$option] = get_option($option, '');
        }

        return new WP_REST_Response($settings, 200);
    }

    public function update_settings(WP_REST_Request $request) {
        $params = $request->get_params();

        foreach ($params as $key => $value) {
            // Validate allowed settings keys
            $allowed_keys = [
                'wce_price_check_interval',
                'wce_competitor_websites',
                'wce_alert_threshold_price',
                'wce_low_stock_threshold',
                'wce_notification_emails',
                'wce_enable_whatsapp',
                'wce_ai_confidence_threshold',
            ];

            if (in_array($key, $allowed_keys)) {
                update_option($key, sanitize_text_field($value));
            }
        }

        return new WP_REST_Response(['message' => 'Settings updated'], 200);
    }
}

// Initialize the plugin
function wce_init() {
    return WooCommerceExtensions::get_instance();
}
add_action('plugins_loaded', 'wce_init');
