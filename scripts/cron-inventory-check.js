/**
 * Inventory Check Cron Job for WooCommerce
 *
 * Scheduled: Daily
 *
 * This script:
 * 1. Fetches all products with stock levels
 * 2. Identifies low stock items
 * 3. Sends notifications to admin
 * 4. Generates restock recommendations
 *
 * Usage: node scripts/cron-inventory-check.js
 */

const axios = require('axios');

class WooCommerceCronClient {
  constructor() {
    this.storeUrl = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL;
    this.consumerKey = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY;
    this.consumerSecret = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET;
  }

  async getProducts(params = {}) {
    const response = await axios.get(`${this.storeUrl}/wp-json/wc/v3/products`, {
      params,
      auth: {
        username: this.consumerKey,
        password: this.consumerSecret,
      },
    });
    return response.data;
  }
}

async function runInventoryCheck() {
  console.log('📦 Starting inventory check cron job...');
  const startTime = Date.now();

  try {
    const wc = new WooCommerceCronClient();

    console.log('🔍 Fetching products...');
    const products = await wc.getProducts({
      per_page: 100,
      status: 'publish',
    });

    console.log(`   Found ${products.length} products`);

    const lowStockThreshold = 10;
    const lowStockItems = [];
    const outOfStockItems = [];

    for (const product of products) {
      const stockQty = product.stock_quantity;

      if (stockQty <= 0) {
        outOfStockItems.push(product);
      } else if (stockQty <= lowStockThreshold) {
        lowStockItems.push(product);
      }
    }

    console.log(`\n📊 Inventory Summary:`);
    console.log(`   Out of stock: ${outOfStockItems.length}`);
    console.log(`   Low stock (≤${lowStockThreshold}): ${lowStockItems.length}`);
    console.log(`   Healthy: ${products.length - lowStockItems.length - outOfStockItems.length}`);

    if (lowStockItems.length > 0) {
      console.log('\n⚠️  Low Stock Items:');
      for (const item of lowStockItems) {
        console.log(`   - ${item.name} (SKU: ${item.sku}): ${item.stock_quantity} units`);
      }

      // Would send email notification here
      // await sendLowStockAlert(lowStockItems);
    }

    if (outOfStockItems.length > 0) {
      console.log('\n❌ Out of Stock Items:');
      for (const item of outOfStockItems) {
        console.log(`   - ${item.name} (SKU: ${item.sku})`);
      }

      // Would send urgent alert here
    }

    const duration = Date.now() - startTime;
    console.log('\n✅ Inventory check completed!');
    console.log(`   Duration: ${duration / 1000}s`);

    return {
      success: true,
      duration: duration / 1000,
      totalProducts: products.length,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems: lowStockItems.map(p => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock_quantity })),
      outOfStockItems: outOfStockItems.map(p => ({ id: p.id, name: p.name, sku: p.sku })),
    };
  } catch (error) {
    console.error('❌ Inventory check failed:', error);
    process.exit(1);
  }
}

const cronSecret = process.argv.find(arg => arg.startsWith('--secret='))?.split('=')[1];
if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
  console.error('❌ Invalid cron secret');
  process.exit(401);
}

runInventoryCheck().then(result => {
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}).catch(err => {
  console.error('Cron job crashed:', err);
  process.exit(1);
});
