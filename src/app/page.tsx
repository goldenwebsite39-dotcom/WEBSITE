import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import {
  ShoppingCart,
  Monitor,
  Cpu,
  HardDrive,
  MemoryStick,
  Zap,
  ChevronRight,
  Star,
  Shield,
  Truck,
  Headphones,
} from 'lucide-react';
import { woocommerce } from '@/lib/woocommerce/client';
import ProductGrid from '@/components/products/ProductGrid';
import { Spinner } from '@/components/ui/index';

export default async function HomePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Fetch featured products from WooCommerce
  let featuredProducts = [];
  try {
    featuredProducts = await woocommerce.getProducts({
      per_page: 8,
      status: 'publish',
      featured: true,
    });
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
  }

  const categories = [
    { name: 'Graphics Cards', slug: 'graphics-cards', icon: Monitor },
    { name: 'Processors', slug: 'processors', icon: Cpu },
    { name: 'Memory', slug: 'memory', icon: MemoryStick },
    { name: 'Storage', slug: 'storage', icon: HardDrive },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="flex items-center space-x-2">
                <Zap className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold">GamingPC Store</span>
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/products" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition">
                  Products
                </Link>
                {categories.slice(0, 3).map(cat => (
                  <Link
                    key={cat.slug}
                    href={`/products?category=${cat.slug}`}
                    className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition"
                  >
                    {cat.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/account" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition">
                Account
              </Link>
              <Link href="/cart" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 transition relative">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  0
                </span>
              </Link>
              <Link href="/admin">
                <Button size="sm" variant="outline">Admin</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-balance">
                Build Your Ultimate Gaming Machine
              </h1>
              <p className="text-xl text-primary-100 mb-8">
                Premium components, expert curation, and unbeatable prices. Elevate your gaming experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-100">
                    Shop Now
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/products?category=graphics-cards">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Browse GPUs
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="aspect-square bg-white/10 rounded-2xl backdrop-blur-sm p-8">
                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center">
                  <Monitor className="h-32 w-32 text-primary-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
                <Shield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Warranty Guarantee</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All products come with manufacturer warranty
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Truck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Fast Shipping</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Free delivery on orders over $500
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Best Prices</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Price match guarantee on all items
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <Headphones className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Expert Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  24/7 technical assistance
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Shop by Category</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/products?category=${cat.slug}`}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-primary-700 opacity-0 group-hover:opacity-10 transition"></div>
                  <div className="p-6 relative">
                    <Icon className="h-12 w-12 text-gray-900 dark:text-white mx-auto mb-4" />
                    <h3 className="font-semibold text-lg text-center">{cat.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
                      Browse collection
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Link href="/products" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
              View All <ChevronRight className="ml-1 h-5 w-5" />
            </Link>
          </div>
          {featuredProducts.length > 0 ? (
            <ProductGrid products={featuredProducts} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No featured products available</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Zap className="h-8 w-8 text-primary-400" />
                <span className="text-xl font-bold">GamingPC Store</span>
              </div>
              <p className="text-gray-400 text-sm">
                Your destination for premium gaming hardware. Quality components, expert service, and the best prices.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/products" className="hover:text-white transition">Products</Link></li>
                <li><Link href="/cart" className="hover:text-white transition">Cart</Link></li>
                <li><Link href="/account" className="hover:text-white transition">My Account</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white transition">Shipping Info</Link></li>
                <li><Link href="#" className="hover:text-white transition">Returns</Link></li>
                <li><Link href="#" className="hover:text-white transition">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} Gaming PC Store. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
