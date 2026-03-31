import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { woocommerce } from '@/lib/woocommerce/client';
import { db } from '@/lib/db/client';
import { sendAIPricingSuggestion } from '@/lib/notifications/email';

/**
 * POST /api/cron/ai-pricing
 * Cron secret required via header: X-Cron-Secret: <secret>
 *
 * This endpoint:
 * 1. Fetches products (limited to avoid OpenAI costs)
 * 2. Uses OpenAI to analyze each product
 * 3. Stores suggestions in database
 * 4. Optionally auto-applies high-confidence suggestions (>85% and >5% price change)
 * 5. Sends email notifications for suggestions
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
    analyzed: 0,
    suggestionsGenerated: 0,
    autoApplied: 0,
    errors: 0,
    duration: 0,
  };

  try {
    console.log('🤖 Starting AI pricing cron...');

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Fetch products - limit to avoid high costs
    const products = await woocommerce.getProducts({
      per_page: 20, // Cost control: only analyze 20 products per run
      status: 'publish',
      stock_status: 'instock',
    });

    console.log(`   Found ${products.length} products to analyze`);

    const confidenceThreshold = parseFloat(process.env.AI_CONFIDENCE_THRESHOLD || '85') / 100;
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').filter(Boolean) || [];

    for (const product of products) {
      try {
        const currentPrice = parseFloat(product.price);
        if (!currentPrice) continue;

        console.log(`\nAnalyzing: ${product.name} (ID: ${product.id})`);

        // Get sales data (in production, fetch from WooCommerce reports)
        // For now, use placeholder
        const salesData = await getProductSalesData(product.id);

        // Generate AI suggestion
        const suggestion = await generatePricingSuggestion(openai, product, salesData);

        if (!suggestion) {
          console.log(`   ⚠️  No suggestion generated`);
          results.errors++;
          continue;
        }

        console.log(`   💡 Suggestion: $${suggestion.suggested_price} (margin: ${suggestion.suggested_margin_percent}%)`);
        console.log(`   Confidence: ${(suggestion.confidence_score * 100).toFixed(0)}%`);
        console.log(`   Positioning: ${suggestion.price_positioning}`);

        // Store suggestion in database
        try {
          await db.createAISuggestion({
            product_id: product.id,
            suggested_price: suggestion.suggested_price,
            current_price: currentPrice,
            confidence_score: suggestion.confidence_score,
            reasoning: suggestion.reasoning,
            price_positioning: suggestion.price_positioning,
            expected_impact: suggestion.expected_impact,
          });
          results.suggestionsGenerated++;
        } catch (dbError) {
          console.error(`   ❌ Failed to store suggestion:`, dbError);
          results.errors++;
          continue;
        }

        // Send notification to admin
        if (adminEmails.length > 0 && suggestion.confidence_score >= confidenceThreshold) {
          try {
            await sendAIPricingSuggestion({
              adminEmails,
              productName: product.name,
              currentPrice,
              suggestedPrice: suggestion.suggested_price,
              confidence: suggestion.confidence_score,
              reasoning: suggestion,
            });
          } catch (notifyError) {
            console.error(`   ❌ Failed to send notification:`, notifyError);
          }
        }

        // Auto-apply if very high confidence and significant change (>5%)
        const priceChangePercent = Math.abs((suggestion.suggested_price - currentPrice) / currentPrice) * 100;
        if (
          suggestion.confidence_score >= confidenceThreshold &&
          priceChangePercent > 5
        ) {
          try {
            const newPrice = suggestion.suggested_price;
            await woocommerce.updateProduct(product.id, { regular_price: newPrice.toString() });
            results.autoApplied++;
            console.log(`   ✅ Auto-applied new price: $${newPrice.toFixed(2)}`);

            // Mark suggestion as applied
            // Note: we'd need the suggestion ID, but for MVP we skip
          } catch (updateError) {
            console.error(`   ❌ Failed to update product price:`, updateError);
          }
        }

        results.analyzed++;
      } catch (productError) {
        console.error(`   ❌ Error analyzing product ${product.id}:`, productError);
        results.errors++;
      }

      // Rate limiting for OpenAI
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    results.success = true;
    results.duration = (Date.now() - startTime) / 1000;

    console.log('✅ AI pricing cron completed');
    console.log(`   Duration: ${results.duration}s`);
    console.log(`   Products analyzed: ${results.analyzed}`);
    console.log(`   Suggestions generated: ${results.suggestionsGenerated}`);
    console.log(`   Auto-applied: ${results.autoApplied}`);
    console.log(`   Errors: ${results.errors}`);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('❌ AI pricing cron failed:', error);
    return NextResponse.json(
      { ...results, success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function getProductSalesData(productId: number) {
  // In production, fetch from WooCommerce reports API:
  // const report = await woocommerce.getSalesReport({ ... });
  // For now, return placeholder
  return {
    sales_count: 0,
    revenue: 0,
  };
}

async function generatePricingSuggestion(
  openai: OpenAI,
  product: any,
  salesData: { sales_count: number; revenue: number }
) {
  const prompt = `
Analyze this product and suggest optimal pricing. Return ONLY valid JSON:

Product: ${product.name}
Category: ${product.categories?.[0]?.name || 'Unknown'}
Current Price: $${product.price}
Stock Quantity: ${product.stock_quantity || '∞'}
On Sale: ${product.on_sale ? 'Yes' : 'No'}
Regular Price: ${product.regular_price || 'N/A'}
Sales (30 days): ${salesData.sales_count}
Revenue (30 days): $${salesData.revenue}

Consider:
1. Cost basis and profit margins
2. Competitor pricing (not available in this analysis)
3. Stock levels (high stock may warrant discount)
4. Sales velocity
5. Product lifecycle (new vs mature)
6. Market demand

Respond with:
{
  "suggested_price": number,
  "suggested_margin_percent": number (20-60),
  "confidence_score": 0.0-1.0,
  "reasoning": {
    "cost_basis": "explanation",
    "inventory_consideration": "explanation",
    "demand_factors": "explanation",
    "strategic_recommendation": "explanation"
  },
  "price_positioning": "above_average|competitive|below_average",
  "expected_impact": "brief description"
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // or 'gpt-3.5-turbo' for cost savings
      messages: [
        {
          role: 'system',
          content: 'You are an expert eCommerce pricing strategist. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return null;
  }
}
