'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/lib/context/CartProvider';
import { useState } from 'react';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    permalink: string;
    price: string;
    regular_price: string;
    sale_price: string;
    on_sale: boolean;
    stock_status: 'instock' | 'outofstock' | 'onbackorder';
    images: Array<{ src: string; name: string; alt: string }>;
    categories: Array<{ id: number; name: string; slug: string }>;
    short_description: string;
  };
  showAddToCart?: boolean;
}

export function ProductCard({ product, showAddToCart = true }: ProductCardProps) {
  const { addToCart, isInCart } = useCart();
  const [loading, setLoading] = useState(false);

  const inCart = isInCart(product.id);
  const imageUrl = product.images?.[0]?.src || '/placeholder.png';

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      await addToCart(product.id, 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
        <Link href={`/products/${product.slug}`}>
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>

        {/* Sale Badge */}
        {product.on_sale && (
          <div className="absolute top-2 left-2">
            <Badge variant="danger">Sale</Badge>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          onClick={() => {/* Add to wishlist logic */}}
        >
          <Heart className="h-4 w-4 text-gray-400 hover:text-red-500" />
        </button>
      </div>

      <CardContent className="p-4">
        <div className="mb-2">
          {product.categories?.[0] && (
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {product.categories[0].name}
            </p>
          )}
          <Link
            href={`/products/${product.slug}`}
            className="block hover:text-primary-600 transition"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mt-1">
              {product.name}
            </h3>
          </Link>
        </div>

        {product.short_description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {product.short_description.replace(/<[^>]*>/g, '')}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(product.price || product.regular_price)}
            </span>
            {product.on_sale && product.regular_price && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(product.regular_price)}
              </span>
            )}
          </div>
        </div>

        {showAddToCart && (
          <Button
            variant="primary"
            size="sm"
            className="w-full mt-4"
            onClick={handleAddToCart}
            disabled={loading || product.stock_status === 'outofstock'}
            isLoading={loading}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.stock_status === 'outofstock' ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
