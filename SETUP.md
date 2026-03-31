# Setup Guide - WooCommerce Extensions MVP

This guide will walk you through setting up the complete admin system with price tracking, notifications, and AI pricing.

## Prerequisites

1. **Existing WooCommerce Store** - WordPress site with WooCommerce installed and REST API enabled
2. **WooCommerce API Keys** - Create keys with read/write permissions
3. **Node.js 18+** - For running the Next.js development server
4. **Vercel Account** (or other hosting) - For deployment

---

## Step 1: Install WordPress Plugin

The custom database tables and REST API endpoints are provided via a WordPress plugin.

1. Go to your WordPress admin → Plugins → Add New → Upload Plugin
2. Upload the file: `wordpress-plugin/woocommerce-extensions.php`
3. Activate the plugin
4. The plugin will automatically create these tables on activation:
   - `wp_wc_price_history` - Stores competitor price comparisons
   - `wp_wc_ai_suggestions` - Stores AI pricing suggestions
   - `wp_wc_notifications` - Stores notification queue
5. The plugin will also generate a `wce_cron_secret` option (view in settings)

**Manual Installation via FTP:**
```bash
# Copy plugin to WordPress plugins directory
cp -r wordpress-plugin /path/to/wordpress/wp-content/plugins/woocommerce-extensions
# Then activate from WP admin
```

---

## Step 2: Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```bash
cp .env.local.example .env.local
```

Required variables:

### WooCommerce
```env
NEXT_PUBLIC_WOOCOMMERCE_STORE_URL=https://yourstore.com
NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY=ck_your_key_here
NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET=cs_your_secret_here
```

**How to get these:**
- WordPress Admin → WooCommerce → Settings → Advanced → REST API
- Create new API key with "Read/Write" permissions
- Copy Consumer Key and Consumer Secret

### Authentication
```env
NEXTAUTH_SECRET=$(openssl rand -base64 32)  # Generate random secret
ADMIN_EMAILS=admin@example.com,you@example.com  # Comma-separated
ADMIN_PASSWORD=your_secure_admin_password
```

### Notifications
```env
RESEND_API_KEY=re_your_resend_key  # Get from resend.com
NOTIFICATION_EMAIL_FROM=noreply@yourdomain.com
```

### WhatsApp (Optional)
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
ENABLE_WHATSAPP=false  # Set to true to enable
ADMIN_WHATSAPP=+971501234567  # E.164 format
```

### OpenAI
```env
OPENAI_API_KEY=sk-your-openai-key
AI_CONFIDENCE_THRESHOLD=85
```

### Cron Secret
```env
CRON_SECRET=your_random_cron_secret  # Any strong random string
```

---

## Step 3: Install Dependencies

```bash
npm install
```

If papaparse types are missing:
```bash
npm install --save-dev @types/papaparse
```

---

## Step 4: Run Development Server

```bash
npm run dev
```

Open http://localhost:3000/admin
- You should be redirected to `/login`
- Enter your admin email and password
- Access the dashboard

---

## Step 5: Configure Price Tracking Settings

1. Go to `/admin/settings`
2. Set **Alert Threshold** (e.g., 10%)
3. Add **Competitor Websites**:
   ```
   https://mindtech.ae
   https://adarc.ae
   https://gccgamers.com
   https://sharafdg.com
   https://switchelectronics.ae
   ```
4. Add **Admin Notification Emails**
5. Click **Save Settings**

---

## Step 6: Test Price Tracker

1. Go to `/admin/price-tracking`
2. Click **Check Prices Now**
3. Wait for completion
4. View price history and alerts

**Note:** The initial check uses placeholder scrapers. You'll see "0 prices found" until real scrapers are implemented.

---

## Step 7: Configure Cron Jobs

The cron endpoints are ready! Set them up on your hosting provider:

### Vercel (Recommended)

Add a `vercel.json` file (already provided) with your cron schedule:

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

**Deploy to Vercel:**
```bash
vercel --prod
```

Then set cron secrets in Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add `CRON_SECRET` (same value as `.env.local`)

### Other Hosts (Railway, Render, etc.)

Set up cron scheduler to call these endpoints with header:

```
POST https://yourdomain.com/api/cron/price-check
Header: X-Cron-Secret: your_cron_secret

POST https://yourdomain.com/api/cron/inventory-check
Header: X-Cron-Secret: your_cron_secret

POST https://yourdomain.com/api/cron/ai-pricing
Header: X-Cron-Secret: your_cron_secret
```

Or use external services:
- cron-job.org
- EasyCron
- GitHub Actions

---

## Step 8: Test Notifications

1. Go to `/admin/notifications`
2. You should see the inventory check notification from step 5
3. To test email:
   - Set a low stock threshold (e.g., 10) in Settings
   - Wait for inventory cron to run
   - Or manually trigger: `curl -X POST https://yourdomain.com/api/cron/inventory-check -H "X-Cron-Secret: your_secret"`

---

## Step 9: Implement Real Scrapers (Placeholder → Production)

The cron includes placeholder competitor scraping. To collect real prices:

### Option A: Build Custom Scrapers

Edit `src/app/api/cron/price-check/route.ts` and replace `checkCompetitorPrices()` function:

```typescript
async function checkCompetitorPrices(productName: string, sku?: string) {
  const competitors = [
    { name: 'MindTech', url: `https://mindtech.ae/search?q=${encodeURIComponent(productName)}` },
    // ...
  ];

  const foundPrices = [];

  for (const competitor of competitors) {
    const price = await scrapePrice(competitor.url, productName);
    if (price) {
      foundPrices.push({ ...competitor, price });
    }
  }

  return foundPrices;
}

async function scrapePrice(url: string, productName: string): Promise<number | null> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0...' }
  });
  const html = await response.text();

  // Parse HTML with cheerio
  const $ = cheerio.load(html);
  // Find product element and extract price
  const priceText = $(selector).text();
  return parseFloat(priceText.replace(/[^\d.]/g, ''));
}
```

**Install scraper dependencies:**
```bash
npm install cheerio puppeteer
```

### Option B: Use External API Services

- **Keepa** - Amazon price tracking (paid)
- **PriceAPI** - Multi-retailer price monitoring (paid)
- **ScraperAPI** - Managed web scraping (paid)

---

## Step 10: Deploy

### Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Set all environment variables (from `.env.local`)
4. Deploy
5. Add cron jobs in Vercel dashboard (or use `vercel.json`)

### Other Platforms

- **Railway**: Add environment vars, use cron add-on
- **Render**: Use Cron Jobs feature
- **DigitalOcean App Platform**: Add env vars, use Cron as external service
- **AWS/Google Cloud**: Set up CloudWatch/Cloud Scheduler

---

## Troubleshooting

### "401 Unauthorized" from WooCommerce
- Verify API keys are correct
- Ensure REST API is enabled in WooCommerce
- Check that API keys have read/write permissions
- Try the API directly: `curl -u "ck:cs" https://yourstore.com/wp-json/wc/v3/products`

### Database tables not created
- Check plugin is activated
- View WordPress → Plugins → WooCommerce Extensions
- Check `wp_options` table for `wce_cron_secret` option
- Enable `WP_DEBUG` to see errors

### Prices not showing in tracking
- Placeholder scrapers return nothing
- Implement real scrapers in `src/app/api/cron/price-check/route.ts`

### Emails not sending
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for sent emails
- For production, add custom domain to Resend

### WhatsApp not working
- Verify Twilio credentials
- Enable `ENABLE_WHATSAPP=true`
- Check Twilio sandbox settings for WhatsApp

### High OpenAI costs
- Reduce `per_page` in AI pricing cron (default 20)
- Switch to `gpt-3.5-turbo` model (cheaper)
- Increase `AI_CONFIDENCE_THRESHOLD` to apply fewer suggestions

### Login not working
- Verify `ADMIN_EMAILS` contains your email
- Check `ADMIN_PASSWORD` is correct
- Clear cookies and try again

---

## Production Checklist

- [ ] Change default admin password
- [ ] Use HTTPS for store URL
- [ ] Add custom domain to Resend
- [ ] Configure Twilio WhatsApp production number
- [ ] Set up proper database backups
- [ ] Enable rate limiting on API routes
- [ ] Implement actual competitor scrapers (not placeholders)
- [ ] Set up monitoring/logging
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Test all cron jobs manually
- [ ] Review security headers
- [ ] Enable Vercel/Cloudflare caching
- [ ] Set up uptime monitoring

---

## Support

For issues:
1. Check browser console for frontend errors
2. Check server logs for API errors
3. Verify WooCommerce API is accessible
4. Check WordPress → WooCommerce → Status → Logs
5. Test API endpoints directly with curl/Postman

---

## License

MIT
