import { Twilio } from 'twilio';

const twilioClient = Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export interface WhatsAppMessage {
  to: string; // Format: 'whatsapp:+1234567890'
  body: string;
}

export async function sendWhatsAppNotification(message: WhatsAppMessage) {
  try {
    const result = await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
      body: message.body,
      to: message.to,
    });

    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendLowStockWhatsApp({
  to,
  lowStockItems,
}: {
  to: string;
  lowStockItems: Array<{ name: string; sku: string; stock_quantity: number }>;
}) {
  let message = `🚨 *LOW STOCK ALERT*\n\n`;
  message += `The following items are below threshold:\n\n`;

  lowStockItems.forEach((item, index) => {
    message += `${index + 1}. *${item.name}*\n`;
    message += `   SKU: ${item.sku} | Stock: ${item.stock_quantity}\n\n`;
  });

  message += `Please restock soon to avoid lost sales.\n`;
  message += `View dashboard: ${process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL}/admin`;

  return await sendWhatsAppNotification({
    to,
    body: message,
  });
}

export async function sendPriceDropWhatsApp({
  to,
  productName,
  competitorName,
  ourPrice,
  competitorPrice,
}: {
  to: string;
  productName: string;
  competitorName: string;
  ourPrice: number;
  competitorPrice: number;
}) {
  const priceDiff = ((ourPrice - competitorPrice) / competitorPrice * 100).toFixed(1);
  const isHigher = parseFloat(priceDiff) > 0;

  let message = `💰 *PRICE ALERT*\n\n`;
  message += `Product: *${productName}*\n`;
  message += `Competitor: ${competitorName}\n`;
  message += `Our Price: $${ourPrice.toFixed(2)}\n`;
  message += `Comp. Price: $${competitorPrice.toFixed(2)}\n`;
  message += `Difference: ${isHigher ? '+' : ''}${priceDiff}%\n\n`;

  if (isHigher && parseFloat(priceDiff) > 10) {
    message += `⚠️ Our price is significantly higher. Consider reduction.\n`;
  } else if (!isHigher) {
    message += `✅ We're competitive on this product.\n`;
  }

  message += `\nView details: ${process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL}/admin/price-tracking`;

  return await sendWhatsAppNotification({
    to,
    body: message,
  });
}

export async function sendOrderAlertWhatsApp({
  to,
  orderNumber,
  customerName,
  total,
  status,
}: {
  to: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
}) {
  let message = `🛒 *NEW ORDER*\n\n`;
  message += `Order #: *#${orderNumber}*\n`;
  message += `Customer: ${customerName}\n`;
  message += `Total: $${total.toFixed(2)}\n`;
  message += `Status: ${status}\n\n`;
  message += `View order: ${process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL}/admin/orders`;

  return await sendWhatsAppNotification({
    to,
    body: message,
  });
}
