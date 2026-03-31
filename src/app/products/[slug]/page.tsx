'use client';

import { useEffect, useState, use } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingCart, Heart, Share2, Truck, Shield, RefreshCw, Minus, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/index';
import { toast } from 'react-hot-toast';
import { useCart } from '@/lib/context/CartProvider';
import { woocommerce } from '@/lib/woocommerce/client';
import { formatCurrency } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamic import for related products
const ProductGrid = dynamic(() => import('@/components/products/ProductGrid'), {
  ssr: false,
});

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { addToCart, isInCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        // Search by slug (need to fetch all products with search)
        const products = await woocommerce.getProducts({
          search: slug,
          per_page: 1,
        });

        if (products.length > 0) {
          const prod = products[0];
          setProduct(prod);

          // If variable product, fetch variations
          if (prod.type === 'variable') {
            const variations = await woocommerce.getVariations(prod.id);
            setSelectedVariation(variations[0] || null);
          }

          // Fetch related products (by category)
          if (prod.categories?.[0]?.id) {
            const related = await woocommerce.getProducts({
              category: prod.categories[0].id,
              per_page: 10,
            });
            // Filter out current product
            const filtered = related.filter(p => p.id !== prod.id).slice(0, 6);
            setRelatedProducts(filtered);
          }
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const handleAddToCart = async () => {
    setAddingToCart(true);
    try {
      const productId = selectedVariation?.id || product?.id;
      if (!productId) {
        toast.error('Product not available');
        return;
      }

      await addToCart(productId, quantity);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleVariationChange = (variation: any) => {
    setSelectedVariation(variation);
    setQuantity(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The product you're looking for doesn't exist or is no longer available.
          </p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Determine current price
  const currentPrice = selectedVariation?.price || product.price;
  const regularPrice = selectedVariation?.regular_price || product.regular_price;
  const isOnSale = currentPrice !== regularPrice && parseFloat(currentPrice) < parseFloat(regularPrice);
  const imageUrl = selectedVariation?.image?.src || product.images?.[0]?.src || '/placeholder.png';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8 text-sm">
          <a href="/" className="text-gray-500 hover:text-primary-600">Home</a>
          <span className="mx-2 text-gray-400">/</span>
          <a href="/products" className="text-gray-500 hover:text-primary-600">Products</a>
          {product.categories?.[0] && (
            <>
              <span className="mx-2 text-gray-400">/</span>
              <a
                href={`/products?category=${product.categories[0].slug}`}
                className="text-gray-500 hover:text-primary-600"
              >
                {product.categories[0].name}
              </a>
            </>
          )}
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 dark:text-white">{product.name}</span>
        </nav>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div>
            <div className="aspect-square bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-4 relative">
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {isOnSale && (
                <div className="absolute top-4 left-4">
                  <Badge variant="danger">Sale</Badge>
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((image: any, idx: number) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg overflow-hidden border-2 border-primary-600"
                  >
                    <img
                      src={image.src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {product.name}
              </h1>
              {product.rating_count > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">
                        {i < Math.floor(parseFloat(product.average_rating)) ? '★' : '☆'}
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({product.rating_count} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="mb-6">
              <div className="flex items-baseline space-x-4">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(currentPrice)}
                </span>
                {isOnSale && regularPrice && (
                  <span className="text-2xl text-gray-500 line-through">
                    {formatCurrency(regularPrice)}
                  </span>
                )}
              </div>
              {isOnSale && (
                <Badge variant="danger" className="mt-2">
                  Save {formatCurrency(parseFloat(regularPrice) - parseFloat(currentPrice))}
                </Badge>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock_status === 'instock' ? (
                <p className="text-green-600 dark:text-green-400 font-medium">
                  ✓ In Stock
                </p>
              ) : product.stock_status === 'onbackorder' ? (
                <p className="text-yellow-600 dark:text-yellow-400 font-medium">
                  Available on backorder
                </p>
              ) : (
                <p className="text-red-600 dark:text-red-400 font-medium">
                  Out of Stock
                </p>
              )}
            </div>

            {/* Variations */}
            {product.attributes && product.attributes.length > 0 && (
              <Card className="mb-6">
                <CardContent className="pt-6">
                  {product.attributes.map((attr: any) => (
                    <div key={attr.id} className="mb-4">
                      <h3 className="font-medium mb-2">{attr.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {attr.options.map((option: string) => (
                          <button
                            key={option}
                            className={`px-4 py-2 border rounded-lg ${
                              selectedVariation?.attributes?.find(
                                (a: any) => a.name === attr.name && a.option === option
                              )
                                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                            }`}
                            onClick={() => {
                              // Find variation matching this option
                              const variation = product.variations?.find((v: any) =>
                                v.attributes?.every(
                                  (a: any) =>
                                    a.name === attr.name
                                      ? a.option === option
                                      : selectedVariation?.attributes?.find(
                                          (va: any) => va.name === a.name
                                        )?.option === a.option
                                )
                              );
                              if (variation) handleVariationChange(variation);
                            }}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={product.stock_status === 'outofstock' || addingToCart}
                  isLoading={addingToCart}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Truck className="h-6 w-6 mx-auto mb-2 text-primary-600" />
                <p className="text-sm font-medium">Free Shipping</p>
                <p className="text-xs text-gray-500">Orders over $500</p>
              </div>
              <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Shield className="h-6 w-6 mx-auto mb-2 text-primary-600" />
                <p className="text-sm font-medium">Warranty</p>
                <p className="text-xs text-gray-500">2-year coverage</p>
              </div>
              <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 text-primary-600" />
                <p className="text-sm font-medium">Easy Returns</p>
                <p className="text-xs text-gray-500">30-day policy</p>
              </div>
            </div>

            {/* Description */}
            <Card className="mt-8">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <div
                  className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: product.description || product.short_description }}
                />
              </CardContent>
            </Card>

            {/* Additional Information */}
            {product.meta_data && product.meta_data.length > 0 && (
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
                  <table className="w-full">
                    <tbody>
                      {product.meta_data
                        .filter((meta: any) => !meta.key.startsWith('_'))
                        .map((meta: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                            <td className="py-2 pr-4 font-medium">{meta.key}</td>
                            <td className="py-2">{meta.value}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <ProductGrid products={relatedProducts} />
          </div>
        )}
      </div>
    </div>
  );
}
