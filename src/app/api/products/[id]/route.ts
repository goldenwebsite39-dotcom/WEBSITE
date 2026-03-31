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

    // Try to get by ID first (numeric)
    let product;
    if (!isNaN(Number(id))) {
      product = await woocommerce.getProduct(Number(id));
    } else {
      // If not numeric, search by slug
      const products = await woocommerce.getProducts({
        slug: id,
        per_page: 1,
      });
      product = products[0];
    }

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return NextResponse.json(
      { message: 'Failed to fetch product', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
