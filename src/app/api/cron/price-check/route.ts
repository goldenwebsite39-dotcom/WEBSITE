import { NextRequest, NextResponse } from 'next/server';
import { woocommerce } from '@/lib/woocommerce/client';
import { db } from '@/lib/db/client';
import { sendPriceDropAlert, sendLowStockAlert } from '@/lib/notifications/email';

/**
 * POST /api/cron/price-check
 * Cron secret required via header: X-Cron-Secret: <secret>
 *
 * This endpoint:
 * 1. Fetches all products
 * 2. Scrapes competitor prices (placeholder for now)
 * 3. Compares and logs price differences
 * 4. Sends alerts for significant drops
 */
export async function POST(request: NextRequest) {
  const cronSecret = request.headers.get('X-Cron-Secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret || cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    success: false,
    productsChecked: 0,
    competitorPricesFound: 0,
    alertsSent: 0,
    errors: 0,
    duration: 0,
  };

  try {
    console.log('🔍 Starting price check cron...');

    // Fetch products from WooCommerce
    const products = await woocommerce.getProducts({
      per_page: 100,
      status: 'publish',
    });

    console.log(`   Found ${products.length} products to check`);

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').filter(Boolean) || [];
    const alertThreshold = parseFloat(process.env.ALERT_THRESHOLD || '10'); // 10% price difference

    for (const product of products) {
      try {
        const ourPrice = parseFloat(product.price);
        if (!ourPrice) continue;

        // For MVP: Use placeholder scrapers
        // In production, implement actual competitor scrapers
        const competitorPrices = await checkCompetitorPrices(product.name, product.sku);

        if (competitorPrices.length > 0) {
          for (const competitor of competitorPrices) {
            const priceDiff = ((ourPrice - competitor.price) / competitor.price) * 100;

            // Log to database
            try {
              await db.addPriceHistory({
                product_id: product.id,
                old_price: ourPrice,
                new_price: competitor.price,
                competitor_name: competitor.name,
                competitor_url: competitor.url,
                competitor_price: competitor.price,
              });
            } catch (dbError) {
              console.error(`   Failed to log price history for product ${product.id}:`, dbError);
            }

            // If competitor is significantly lower, send alert
            if (priceDiff > alertThreshold) {
              console.log(`   ⚠️  Alert: ${product.name} is ${priceDiff.toFixed(1)}% higher than ${competitor.name}`);

              // Send email alert
              if (adminEmails.length > 0) {
                try {
                  await sendPriceDropAlert({
                    adminEmails,
                    productName: product.name,
                    competitorName: competitor.name,
                    ourPrice,
                    competitorPrice: competitor.price,
                  });
                  results.alertsSent++;
                } catch (emailError) {
                  console.error(`   Failed to send price alert email:`, emailError);
                  results.errors++;
                }
              }
            }

            results.competitorPricesFound++;
          }
        }

        results.productsChecked++;
      } catch (productError) {
        console.error(`   ❌ Error processing product ${product.id}:`, productError);
        results.errors++;
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    results.success = true;
    results.duration = (Date.now() - startTime) / 1000;

    console.log('✅ Price check cron completed');
    console.log(`   Duration: ${results.duration}s`);
    console.log(`   Products checked: ${results.productsChecked}`);
    console.log(`   Competitor prices found: ${results.competitorPricesFound}`);
    console.log(`   Alerts sent: ${results.alertsSent}`);
    console.log(`   Errors: ${results.errors}`);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('❌ Price check cron failed:', error);
    return NextResponse.json(
      { ...results, success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Placeholder competitor scraper - replace with real implementation
async function checkCompetitorPrices(productName: string, sku?: string) {
  // In production, implement actual scrapers using Puppeteer/Playwright or APIs
  // For now, return placeholder data
  // This will be replaced with real competitors: MindTech, Adarc Computer, GCC Gamers, Sharaf DG, Switch Electronics

  const competitors = [
    { name: 'MindTech', url: `https://mindtech.ae/search?q=${encodeURIComponent(productName)}` },
    { name: 'Adarc Computer', url: `https://adarc.ae/search?q=${encodeURIComponent(productName)}` },
    { name: 'GCC Gamers', url: `https://gccgamers.com/search?q=${encodeURIComponent(productName)}` },
    { name: 'Sharaf DG', url: `https://sharafdg.com/search?q=${encodeURIComponent(productName)}` },
    { name: 'Switch Electronics', url: `https://switchelectronics.ae/search?q=${encodeURIComponent(productName)}` },
  ];

  // Simulate finding prices (remove in production, replace with actual scraping)
  const foundPrices = [];
  for (const competitor of competitors) {
    // In production, this would be a real HTTP request and HTML parsing
    // const price = await scrapeUrl(competitor.url);
    // if (price) { foundPrices.push({ ...competitor, price }); }

    // For now, skip (no actual prices)
  }

  return foundPrices;
}
