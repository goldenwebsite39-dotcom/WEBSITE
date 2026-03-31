'use client';

import { useState, useEffect } from 'react';
import { woocommerce } from '@/lib/woocommerce/client';
import { Card, CardContent } from '@/components/ui/Card';

export function Sidebar() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await woocommerce.getCategories({
          hide_empty: true,
          per_page: 50,
        });
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="skeleton h-6 w-1/3 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="skeleton h-4 w-full"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="font-semibold text-lg mb-4">Categories</h2>
        <div className="space-y-2">
          {/* Would implement hierarchical categories with recursion */}
          {categories.map(category => (
            <a
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="block text-gray-600 dark:text-gray-300 hover:text-primary-600 transition py-1"
            >
              {category.name} ({category.count})
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
