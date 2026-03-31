import { NextRequest, NextResponse } from 'next/server';
import { woocommerce } from '@/lib/woocommerce/client';

// GET all products with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const params: any = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      per_page: searchParams.get('per_page') ? parseInt(searchParams.get('per_page')!) : 20,
      status: 'publish',
    };

    if (searchParams.get('category')) {
      params.category = searchParams.get('category');
    }

    if (searchParams.get('search')) {
      params.search = searchParams.get('search');
    }

    if (searchParams.get('orderby')) {
      params.orderby = searchParams.get('orderby');
    }

    if (searchParams.get('order')) {
      params.order = searchParams.get('order');
    }

    if (searchParams.get('featured') === 'true') {
      params.featured = true;
    }

    const products = await woocommerce.getProducts(params);

    // Get total count (approximate - in production you'd use separate endpoint)
    const total = products.length; // This is just for the page

    return NextResponse.json({
      data: products,
      total,
      page: params.page,
      per_page: params.per_page,
      total_pages: Math.ceil(total / params.per_page),
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { message: 'Failed to fetch products', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
