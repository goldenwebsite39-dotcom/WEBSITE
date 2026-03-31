import { NextRequest, NextResponse } from 'next/server';
import { woocommerce } from '@/lib/woocommerce/client';

// POST create order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      payment_method,
      payment_method_title,
      set_paid,
      billing,
      shipping,
      customer_id,
      customer_note,
      line_items,
      shipping_lines,
    } = body;

    if (!payment_method || !billing || !shipping || !line_items) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const order = await woocommerce.createOrder({
      payment_method,
      payment_method_title: payment_method_title || 'Direct Bank Transfer',
      set_paid: set_paid || false,
      billing,
      shipping,
      customer_id,
      customer_note,
      line_items: line_items.map((item: any) => ({
        product_id: item.product_id,
        variation_id: item.variation_id || undefined,
        quantity: item.quantity || 1,
      })),
      shipping_lines: shipping_lines || [],
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { message: 'Failed to create order', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
