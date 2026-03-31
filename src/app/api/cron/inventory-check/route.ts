import { NextRequest, NextResponse } from 'next/server';
import { woocommerce } from '@/lib/woocommerce/client';
import { db } from '@/lib/db/client';
import { sendLowStockAlert } from '@/lib/notifications/email';

/**
 * POST /api/cron/inventory-check
 * Cron secret required via header: X-Cron-Secret: <secret>
 *
 * This endpoint:
 * 1. Fetches all products
 * 2. Identifies low stock and out of stock items
 * 3. Sends email notifications for low stock
 * 4. Logs results to database
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
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    alertsSent: 0,
    errors: 0,
    duration: 0,
    lowStockItems: [] as Array<{ id: number; name: string; sku: string; stock_quantity: number }>,
    outOfStockItems: [] as Array<{ id: number; name: string; sku: string }>,
  };

  try {
    console.log('📦 Starting inventory check cron...');

    const lowStockThreshold = parseInt(process.env.LOW_STOCK_THRESHOLD || '10', 10);

    const products = await woocommerce.getProducts({
      per_page: 100,
      status: 'publish',
    });

    console.log(`   Found ${products.length} products`);
    results.totalProducts = products.length;

    for (const product of products) {
      const stockQty = product.stock_quantity;

      if (stockQty <= 0) {
        results.outOfStockCount++;
        results.outOfStockItems.push({
          id: product.id,
          name: product.name,
          sku: product.sku || 'N/A',
        });
      } else if (stockQty <= lowStockThreshold) {
        results.lowStockCount++;
        results.lowStockItems.push({
          id: product.id,
          name: product.name,
          sku: product.sku || 'N/A',
          stock_quantity: stockQty,
        });
      }
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',').filter(Boolean) || [];

    // Send low stock email alert
    if (results.lowStockCount > 0 && adminEmails.length > 0) {
      try {
        await sendLowStockAlert({
          adminEmails,
          lowStockItems: results.lowStockItems,
        });
        results.alertsSent++;
        console.log(`   ✅ Low stock alert sent for ${results.lowStockCount} items`);
      } catch (error) {
        console.error('   ❌ Failed to send low stock alert:', error);
        results.errors++;
      }
    }

    // Send WhatsApp alerts for urgent cases (out of stock) if enabled
    const whatsappEnabled = process.env.ENABLE_WHATSAPP === 'true';
    const adminWhatsApp = process.env.ADMIN_WHATSAPP; // E.164 format: +971501234567

    if (whatsappEnabled && adminWhatsApp && results.outOfStockCount > 0) {
      const { sendLowStockWhatsApp } = await import('@/lib/notifications/whatsapp');
      try {
        await sendLowStockWhatsApp({
          to: adminWhatsApp,
          lowStockItems: results.lowStockItems.slice(0, 10), // Limit to top 10
        });
        console.log(`   ✅ WhatsApp alert sent for out of stock items`);
      } catch (error) {
        console.error('   ❌ Failed to send WhatsApp alert:', error);
        results.errors++;
      }
    }

    // Log notification to database
    try {
      await db.createNotification({
        type: results.lowStockCount > 0 ? 'email' : 'in_app',
        channel: 'cron',
        title: 'Inventory Check Completed',
        body: `Low stock: ${results.lowStockCount}, Out of stock: ${results.outOfStockCount}`,
        status: 'sent',
        metadata: {
          total_products: results.totalProducts,
          low_stock_count: results.lowStockCount,
          out_of_stock_count: results.outOfStockCount,
        },
      });
    } catch (dbError) {
      console.error('   ❌ Failed to log notification:', dbError);
    }

    results.success = true;
    results.duration = (Date.now() - startTime) / 1000;

    console.log('✅ Inventory check completed');
    console.log(`   Duration: ${results.duration}s`);
    console.log(`   Total products: ${results.totalProducts}`);
    console.log(`   Low stock: ${results.lowStockCount}`);
    console.log(`   Out of stock: ${results.outOfStockCount}`);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('❌ Inventory check cron failed:', error);
    return NextResponse.json(
      { ...results, success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
