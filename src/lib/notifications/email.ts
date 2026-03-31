import { Resend } from 'resend';
import { db } from '@/lib/db/client';

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export interface EmailTemplateProps {
  title: string;
  message: string;
  items?: Array<{ name: string; value: string }>;
  actionUrl?: string;
  actionLabel?: string;
}

function buildEmailHTML({ title, message, items, actionUrl, actionLabel }: EmailTemplateProps): string {
  const itemsHTML = items
    ? items
        .map(
          (item) => `
        <tr>
          <td style="padding: 8px 0; color: #374151; font-weight: 500;">${item.name}</td>
          <td style="padding: 8px 0; color: #6b7280;">${item.value}</td>
        </tr>
      `
        )
        .join('')
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
            color: white;
            padding: 32px 24px;
            text-align: center;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .content {
            padding: 32px 24px;
          }
          .title {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 16px 0;
            color: #111827;
          }
          .message {
            font-size: 16px;
            margin-bottom: 24px;
          }
          .details {
            background-color: #f3f4f6;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
          }
          .details table {
            width: 100%;
          }
          .action {
            text-align: center;
            margin: 32px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0284c7;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
          }
          .footer {
            padding: 24px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${process.env.APP_NAME || 'Store Admin'}</div>
            <div>Admin Notification</div>
          </div>
          <div class="content">
            <h2 class="title">${title}</h2>
            <p class="message">${message}</p>
            ${itemsHTML ? `
              <div class="details">
                <table>${itemsHTML}</table>
              </div>
            ` : ''}
            ${actionUrl && actionLabel ? `
              <div class="action">
                <a href="${actionUrl}" class="button">${actionLabel}</a>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>This is an automated message from ${process.env.APP_NAME || 'the system'}.</p>
            <p>For support, contact ${process.env.SUPPORT_EMAIL || 'support@example.com'}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  try {
    const resendClient = getResend();
    const data = await resendClient.emails.send({
      from: process.env.NOTIFICATION_EMAIL_FROM || 'noreply@example.com',
      to,
      subject,
      html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

export async function sendLowStockAlert({
  adminEmails,
  lowStockItems,
}: {
  adminEmails: string[];
  lowStockItems: Array<{ name: string; sku: string; stock_quantity: number }>;
}) {
  const items = lowStockItems.map((item) => ({
    name: item.name,
    value: `SKU: ${item.sku} - ${item.stock_quantity} units left`,
  }));

  const html = buildEmailHTML({
    title: '🚨 Low Stock Alert',
    message: 'The following products are below the low stock threshold:',
    items,
    actionUrl: `${process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL}/admin/products?filter=low-stock`,
    actionLabel: 'View Products',
  });

  const result = await sendEmail({
    to: adminEmails,
    subject: `[Low Stock] ${lowStockItems.length} items need attention`,
    html,
  });

  // Log notification to database
  if (result.success) {
    await db.createNotification({
      type: 'email',
      channel: 'email',
      title: 'Low Stock Alert',
      body: `${lowStockItems.length} items are low in stock`,
      status: 'sent',
    });
  }

  return result;
}

export async function sendPriceDropAlert({
  adminEmails,
  productName,
  competitorName,
  ourPrice,
  competitorPrice,
}: {
  adminEmails: string[];
  productName: string;
  competitorName: string;
  ourPrice: number;
  competitorPrice: number;
}) {
  const priceDiff = ((ourPrice - competitorPrice) / competitorPrice * 100).toFixed(1);
  const items = [
    { name: 'Product', value: productName },
    { name: 'Competitor', value: competitorName },
    { name: 'Our Price', value: `$${ourPrice.toFixed(2)}` },
    { name: 'Competitor Price', value: `$${competitorPrice.toFixed(2)}` },
    { name: 'Price Difference', value: `${priceDiff}%` },
  ];

  const html = buildEmailHTML({
    title: '💰 Price Drop Detected',
    message: `Our price is ${Math.abs(parseFloat(priceDiff))}% higher than ${competitorName}. Consider adjusting your pricing.`,
    items,
    actionUrl: `${process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL}/admin/price-tracking`,
    actionLabel: 'View Price Analysis',
  });

  const result = await sendEmail({
    to: adminEmails,
    subject: `[Price Alert] ${productName} - Competitor price lower`,
    html,
  });

  if (result.success) {
    await db.createNotification({
      type: 'email',
      channel: 'email',
      title: 'Price Drop Alert',
      body: `${competitorName} is selling ${productName} for $${competitorPrice.toFixed(2)} (ours: $${ourPrice.toFixed(2)})`,
      status: 'sent',
    });
  }

  return result;
}

export async function sendAIPricingSuggestion({
  adminEmails,
  productName,
  currentPrice,
  suggestedPrice,
  confidence,
  reasoning,
}: {
  adminEmails: string[];
  productName: string;
  currentPrice: number;
  suggestedPrice: number;
  confidence: number;
  reasoning: any;
}) {
  const items = [
    { name: 'Product', value: productName },
    { name: 'Current Price', value: `$${currentPrice.toFixed(2)}` },
    { name: 'Suggested Price', value: `$${suggestedPrice.toFixed(2)}` },
    { name: 'Confidence', value: `${(confidence * 100).toFixed(0)}%` },
    { name: 'Price Positioning', value: reasoning.price_positioning || 'N/A' },
  ];

  const html = buildEmailHTML({
    title: '🤖 AI Pricing Suggestion',
    message: `The AI pricing engine has analyzed ${productName} and recommends a new price based on market conditions, inventory, and competitor data.`,
    items,
    actionUrl: `${process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL}/admin/analytics`,
    actionLabel: 'View Analytics',
  });

  const result = await sendEmail({
    to: adminEmails,
    subject: `[AI Suggestion] ${productName} - Price optimization`,
    html,
  });

  if (result.success) {
    await db.createNotification({
      type: 'email',
      channel: 'email',
      title: 'AI Pricing Suggestion',
      body: `Suggested price for ${productName}: $${suggestedPrice.toFixed(2)} (confidence: ${(confidence * 100).toFixed(0)}%)`,
      status: 'sent',
    });
  }

  return result;
}
