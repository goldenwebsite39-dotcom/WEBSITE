'use client';

import { ProductCard } from './ProductCard';
import { CardSkeleton } from '@/components/ui/index';

interface ProductGridProps {
  products: Array<any>;
  loading?: boolean;
  showAddToCart?: boolean;
}

export default function ProductGrid({ products, loading = false, showAddToCart = true }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          showAddToCart={showAddToCart}
        />
      ))}
    </div>
  );
}
