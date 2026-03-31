import axios, { type AxiosInstance } from 'axios';

/**
 * Database client for WooCommerce Extensions custom tables
 * Communicates with WordPress plugin REST API
 *
 * IMPORTANT: This client should only be used in server-side code (API routes, cron jobs)
 * as it exposes WooCommerce API credentials.
 */

class DatabaseClient {
  private client: AxiosInstance;

  constructor() {
    const storeUrl = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL || '';
    const consumerKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY || '';
    const consumerSecret = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET || '';

    // Basic Auth credentials
    const basicAuth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    this.client = axios.create({
      baseURL: `${storeUrl}/wp-json`,
      timeout: 30000,
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // ============ PRICE HISTORY ============

  /**
   * Add price history entry
   */
  async addPriceHistory(data: {
    product_id: number;
    old_price: number;
    new_price: number;
    competitor_name: string;
    competitor_url?: string;
    competitor_price: number;
  }) {
    const response = await this.client.post('/wp-json/wc-extensions/v1/price-history', data);
    return response.data;
  }

  /**
   * Get price history for a product
   */
  async getPriceHistory(product_id: number, limit: number = 100) {
    const response = await this.client.get(`/wp-json/wc-extensions/v1/price-history/${product_id}`, {
      params: { limit },
    });
    return response.data;
  }

  // ============ AI SUGGESTIONS ============

  /**
   * Create AI pricing suggestion
   */
  async createAISuggestion(data: {
    product_id: number;
    suggested_price: number;
    current_price: number;
    confidence_score: number;
    reasoning: any;
    price_positioning: string;
    expected_impact?: string;
  }) {
    const response = await this.client.post('/wp-json/wc-extensions/v1/ai-suggestions', data);
    return response.data;
  }

  /**
   * Get AI suggestions with pagination
   */
  async getAISuggestions(params: { page?: number; per_page?: number } = {}) {
    const response = await this.client.get('/wp-json/wc-extensions/v1/ai-suggestions', { params });
    return response.data;
  }

  /**
   * Update AI suggestion (e.g., mark as applied)
   */
  async updateAISuggestion(id: number, data: { is_applied?: boolean }) {
    const response = await this.client.put(`/wp-json/wc-extensions/v1/ai-suggestions/${id}`, data);
    return response.data;
  }

  // ============ NOTIFICATIONS ============

  /**
   * Create notification
   */
  async createNotification(data: {
    user_id?: number;
    type: 'email' | 'whatsapp' | 'in_app';
    channel?: string;
    title: string;
    body: string;
    status?: 'pending' | 'sent' | 'failed' | 'read';
    scheduled_for?: string;
    metadata?: any;
  }) {
    const response = await this.client.post('/wp-json/wc-extensions/v1/notifications', data);
    return response.data;
  }

  /**
   * Get notifications with filters
   */
  async getNotifications(params: { page?: number; per_page?: number; status?: string } = {}) {
    const response = await this.client.get('/wp-json/wc-extensions/v1/notifications', { params });
    return response.data;
  }

  /**
   * Update notification (status, error, etc.)
   */
  async updateNotification(id: number, data: { status?: string; error_message?: string; attempts?: number }) {
    const response = await this.client.put(`/wp-json/wc-extensions/v1/notifications/${id}`, data);
    return response.data;
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: number) {
    const response = await this.client.delete(`/wp-json/wc-extensions/v1/notifications/${id}`);
    return response.data;
  }

  // ============ SETTINGS ============

  /**
   * Get all plugin settings
   */
  async getSettings() {
    const response = await this.client.get('/wp-json/wc-extensions/v1/settings');
    return response.data;
  }

  /**
   * Update plugin settings
   */
  async updateSettings(settings: Record<string, string>) {
    const response = await this.client.post('/wp-json/wc-extensions/v1/settings', settings);
    return response.data;
  }
}

export const db = new DatabaseClient();
