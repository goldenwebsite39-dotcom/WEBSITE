# WooCommerce + Next.js Ecommerce Store

Modern, high-performance ecommerce frontend built with Next.js 14 that connects to your existing WooCommerce store.

## ✨ Features

- **Connected to WooCommerce API** - Uses your existing store with 890+ products
- **Modern UI** - Clean, responsive design with Tailwind CSS
- **Dark Mode** - Full theme support
- **Shopping Cart** - Full cart management with persistence
- **Checkout** - Complete checkout flow
- **Product Filtering** - Categories, search, sorting
- **Admin Dashboard** - Orders, products, inventory overview
- **Price Monitoring** - Automated competitor price checking (extensible)
- **AI Pricing** - GPT-4 powered pricing suggestions
- **Low Stock Alerts** - Automated inventory monitoring
- **SEO Optimized** - Next.js metadata, structured data
- **Fast Performance** - Static generation, code splitting, optimized images

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Existing WooCommerce store with REST API enabled
- WooCommerce API keys (Consumer Key & Secret)

### Setup

1. **Create Next.js app structure** (already done if you're reading this)
```bash
cd woocommerce-nextjs
npm install
```

2. **Configure environment variables**
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# WooCommerce REST API
NEXT_PUBLIC_WOOCOMMERCE_STORE_URL=https://yourstore.com
NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY=ck_your_consumer_key_here
NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET=cs_your_consumer_secret_here

# NextAuth
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000

# Admin emails (comma-separated)
ADMIN_EMAILS=admin@example.com

# Resend (for email notifications)
RESEND_API_KEY=re_your_resend_key
NOTIFICATION_EMAIL_FROM=noreply@yourdomain.com

# OpenAI (AI pricing - optional)
OPENAI_API_KEY=sk-your-openai-key

# App
APP_NAME=Gaming PC Store
SUPPORT_EMAIL=support@yourdomain.com
```

3. **Enable WooCommerce REST API**

Go to your WordPress admin:
- WooCommerce → Settings → Advanced → REST API
- Create new API key (with read/write permissions)
- Copy Consumer Key and Consumer Secret

⚠️ **Important**: Use HTTPS in production! In localhost, you can use:
```env
NEXT_PUBLIC_WOOCOMMERCE_STORE_URL=http://localhost:your-local-site.test
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
woocommerce-nextjs/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Authentication pages
│   │   ├── (dashboard)/         # Admin dashboard
│   │   │   ├── page.tsx         # Dashboard home
│   │   │   ├── products/        # Product management
│   │   │   ├── orders/          # Order management
│   │   │   ├── price-tracking/  # Price monitoring
│   │   │   ├── analytics/       # Analytics
│   │   │   ├── notifications/   # Notification center
│   │   │   └── upload/          # Bulk upload
│   │   ├── api/                 # API routes
│   │   │   ├── products/        # Products API
│   │   │   ├── checkout/        # Create orders
│   │   │   ├── cron/            # Cron endpoints
│   │   │   └── ...
│   │   ├── cart/page.tsx        # Shopping cart
│   │   ├── checkout/page.tsx    # Checkout
│   │   ├── products/            # Product listing
│   │   │   └── [slug]/page.tsx # Product detail
│   │   ├── account/             # User account
│   │   ├── layout.tsx
│   │   └── page.tsx             # Homepage
│   ├── components/
│   │   ├── admin/               # Admin components
│   │   ├── common/              # Theme provider, toggle
│   │   ├── layout/              # Header, Footer
│   │   ├── products/            # Product components
│   │   └── ui/                  # Reusable UI components
│   ├── lib/
│   │   ├── woocommerce/
│   │   │   ├── client.ts        # WooCommerce REST API client
│   │   │   └── types.ts         # TypeScript definitions
│   │   ├── auth/
│   │   │   └── AuthProvider.tsx
│   │   ├── context/
│   │   │   └── CartProvider.tsx
│   │   └── utils/
│   └── types/
├── scripts/
│   ├── cron-price-check.js      # Price monitoring cron
│   ├── cron-inventory-check.js  # Inventory check
│   └── cron-ai-pricing.js       # AI pricing cron
├── .env.local.example
├── next.config.js
├── tailwind.config.js
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Integration

### Products
```
GET    /api/products              # List products (with filters)
GET    /api/products/[id]         # Single product by ID or slug
```

### Checkout
```
POST   /api/checkout              # Create order
```

### Cron (Protected)
```
GET    /api/cron/price-check      # Manual price check
GET    /api/cron/inventory-check  # Manual inventory check
GET    /api/cron/ai-pricing       # Manual AI analysis
```

## 🗄️ Database Extensions (Optional)

Since you're using WooCommerce, all product data, orders, customers are stored in WordPress database.

For custom features (price tracking, AI suggestions, notifications), you may want to add custom tables:

```sql
-- Price tracking logs
CREATE TABLE wc_price_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2),
  competitor_name VARCHAR(255),
  competitor_price DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES wp_posts(ID)
);

-- AI pricing suggestions
CREATE TABLE wc_ai_suggestions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  suggested_price DECIMAL(10,2),
  confidence_score DECIMAL(3,2),
  reasoning JSON,
  is_applied BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES wp_posts(ID)
);

-- Custom notifications
CREATE TABLE wc_notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  type ENUM('email', 'whatsapp', 'in_app'),
  channel VARCHAR(100),
  title VARCHAR(255),
  body TEXT,
  status ENUM('pending', 'sent', 'failed', 'read') DEFAULT 'pending',
  scheduled_for DATETIME,
  sent_at DATETIME NULL,
  attempts INT DEFAULT 0,
  error_message TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

You can create these tables in WordPress using:
- dbDelta() in a custom plugin
- phpMyAdmin
- WP-CLI

## ⏱️ Cron Jobs

Set up scheduled tasks to run automatically:

### On Vercel (Recommended)
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/price-check",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/inventory-check",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/ai-pricing",
      "schedule": "0 10 * * *"
    }
  ]
}
```

### On Railway/Render/Other
Use their cron scheduler or external service:
- cron-job.org
- EasyCron
- GitHub Actions (with schedule)

Run the script directly:
```bash
node scripts/cron-price-check.js --secret=your_cron_secret
```

## 📊 Admin Dashboard

The admin dashboard (`/admin`) shows:

- **Overview**: Total products, orders, revenue, pending orders, low stock alerts
- **Recent Orders**: Latest customer orders
- **Low Stock Items**: Products needing restock
- **Price Monitoring**: Manual trigger for competitor price checking
- **Quick Actions**: Add product, view orders, etc.

Only users with email in `ADMIN_EMAILS` can access `/admin`.

## 🔍 Price Tracking

The price tracking system:

1. **Scrapes competitor websites** (you need to implement the actual scrapers)
2. **Compares with your prices**
3. **Sends alerts** when:
   - Competitor price is 10%+ lower
   - Stock status changes
4. **Suggests price adjustments** based on AI analysis

⚠️ **Important**: Web scraping may violate some websites' Terms of Service. Ensure:
- Check `robots.txt`
- Rate limit your requests
- Consider using official APIs if available
- Use a legitimate data provider like Keepa (for Amazon) or PriceAPI

## 🤖 AI Pricing

Uses OpenAI GPT-4 to analyze:
- Current price vs cost
- Competitor pricing
- Stock levels
- Sales velocity
- Product age & seasonality

Suggests optimal prices balancing:
- Profit margins
- Competitiveness
- Inventory clearance

**Note**: AI pricing requires OpenAI API key. Costs ~$0.01-0.10 per analysis.

## 📱 Mobile Responsive

Fully responsive design with:
- Mobile-first approach
- Collapsible sidebar on mobile
- Touch-friendly buttons
- Optimized images

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to change brand colors:

```js
colors: {
  primary: {
    500: '#0ea5e9', // Change this to your brand color
    // ...
  }
}
```

### Components
All components in `src/components/` are modular and customizable.

### Layout
Modify `src/app/layout.tsx` for global styles, fonts, metadata.

## 🚢 Deployment

### Vercel (Easiest)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Other Platforms
Works on any platform that supports Next.js 14:
- Railway
- Render
- DigitalOcean App Platform
- Netlify

## 🔧 Troubleshooting

### "401 Unauthorized" from WooCommerce
- Check your API keys
- Ensure REST API is enabled in WooCommerce
- Verify store URL is correct (HTTPS in production)
- Check if permalinks are set to "Post name" in WordPress

### Products not showing
- Ensure products are published (status = 'publish')
- Check that product visibility is set to "Shop and search results"
- Clear Next.js cache: delete `.next` folder

### CORS errors
- Add your domain to WooCommerce CORS settings (if using plugin)
- Or use Vercel's middleware to proxy requests

### Slow product images
- Optimize images in WordPress (use Smush, ShortPixel)
- Enable lazy loading
- Use image CDN (Cloudflare Images, Cloudinary)

### Mobile menu not working
Check browser console for errors. Ensure `next-themes` is properly configured.

## 📝 Notes

### Using Custom Database Tables
For price tracking, AI suggestions, custom notifications - you need custom tables in WordPress database. Create a simple plugin:

```php
<?php
/**
 * Plugin Name: WooCommerce Extensions Data
 * Description: Custom tables for price tracking and AI pricing
 * Version: 1.0
 */

register_activation_hook(__FILE__, function() {
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();

    // Create price history table
    $table = $wpdb->prefix . 'wc_price_history';
    $sql = "CREATE TABLE $table (
        id BIGINT PRIMARY KEY AUTO_INCREMENT,
        product_id BIGINT NOT NULL,
        old_price DECIMAL(10,2),
        new_price DECIMAL(10,2),
        competitor_name VARCHAR(255),
        competitor_price DECIMAL(10,2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES {$wpdb->posts}(ID)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
});
```

## 📞 Support

For issues:
1. Check console logs in browser and terminal
2. Verify WooCommerce API credentials
3. Ensure WordPress REST API is working: `https://yourstore.com/wp-json/wc/v3/products`
4. Check WooCommerce logs: WooCommerce → Status → Logs

## 📄 License

MIT

## 🤝 Credits

Built with:
- Next.js 14 (React 18)
- Tailwind CSS
- WooCommerce REST API
- TypeScript
- Lucide Icons
- Vercel Cron Jobs

---

**Note**: This is a template starting point. You'll need to:
- Implement your own competitor scrapers (or use APIs)
- Add proper error handling
- Set up monitoring/logging
- Configure email templates
- Test payment gateway integration
- Add your branding
- Perform security audit before production

Happy selling! 🚀
