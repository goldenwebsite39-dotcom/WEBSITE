'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Sidebar } from '@/components/products/Sidebar';
import { LoadingSpinner } from '@/components/ui/index';
import { Filter, X } from 'lucide-react';
import { woocommerce } from '@/lib/woocommerce/client';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');
  const searchQuery = searchParams.get('search');

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [categories, setCategories] = useState<any[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Build query params
  const buildQuery = useCallback((pageNum: number) => {
    const params: any = {
      page: pageNum,
      per_page: perPage,
      orderby: sortBy,
      order: sortOrder,
      status: 'publish',
    };

    if (categorySlug) {
      // Get category ID from slug
      const category = categories.find(c => c.slug === categorySlug);
      if (category) {
        params.category = category.id;
      }
    }

    if (searchQuery) {
      params.search = searchQuery;
    }

    return params;
  }, [categorySlug, searchQuery, categories, perPage, sortBy, sortOrder]);

  // Fetch products
  const fetchProducts = useCallback(async (pageNum: number, reset: boolean = false) => {
    setLoading(true);
    try {
      const params = buildQuery(pageNum);
      const data = await woocommerce.getProducts(params);

      if (reset) {
        setProducts(data);
      } else {
        setProducts(prev => [...prev, ...data]);
      }

      setTotalPages(Math.ceil(total / perPage));
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [buildQuery, perPage, total]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await woocommerce.getCategories({ hide_empty: true });
        setCategories(data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Load products when dependencies change
  useEffect(() => {
    fetchProducts(1, true);
  }, [categorySlug, searchQuery, perPage, sortBy, sortOrder]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [categorySlug, searchQuery, perPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage === page) return;
    setPage(newPage);
    fetchProducts(newPage);
  };

  const toggleFilters = () => {
    setMobileFiltersOpen(!mobileFiltersOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {searchQuery
              ? `Search results for "${searchQuery}"`
              : categorySlug
              ? categories.find(c => c.slug === categorySlug)?.name || 'Products'
              : 'All Products'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {total} products found
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className={`lg:w-64 flex-shrink-0 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-lg">Filters</h2>
                  <button
                    onClick={toggleFilters}
                    className="lg:hidden p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Categories Filter */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Categories</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        checked={!categorySlug}
                        onChange={() => {/* Handle via URL */}}
                        className="mr-2"
                      />
                      <span>All Categories</span>
                    </label>
                    {categories.map(category => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="radio"
                          name="category"
                          checked={categorySlug === category.slug}
                          onChange={() => {/* Handle via URL */}}
                          className="mr-2"
                        />
                        <span>{category.name} ({category.count})</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range (would implement with actual filter) */}
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Price Range</h3>
                  <div className="flex space-x-2">
                    <Input type="number" placeholder="Min" className="w-full" />
                    <Input type="number" placeholder="Max" className="w-full" />
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {/* Clear filters */}}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Sort & Filter Bar */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={toggleFilters}
                className="lg:hidden flex items-center space-x-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>

              <div className="flex items-center space-x-2 ml-auto">
                <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: 'date', label: 'Newest' },
                    { value: 'price', label: 'Price' },
                    { value: 'popularity', label: 'Popularity' },
                    { value: 'rating', label: 'Rating' },
                  ]}
                  className="w-40"
                />
                <Select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  options={[
                    { value: 'asc', label: 'Ascending' },
                    { value: 'desc', label: 'Descending' },
                  ]}
                  className="w-32"
                />
              </div>
            </div>

            {/* Products */}
            <ProductGrid products={products} loading={loading} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
