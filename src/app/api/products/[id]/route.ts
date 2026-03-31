import { NextRequest, NextResponse } from 'next/server';
import { woocommerce } from '@/lib/woocommerce/client';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET single product by slug or ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params;

    // Get by ID (numeric)
    if (!isNaN(Number(id))) {
      const product = await woocommerce.getProduct(Number(id));
      if (!product) {
        return NextResponse.json(
          { message: 'Product not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(product);
    }

    // Non-numeric IDs not supported in this demo
    return NextResponse.json(
      { message: 'Product not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json(
      { message: 'Failed to fetch product', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
