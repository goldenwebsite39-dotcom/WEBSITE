'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCart } from '@/lib/context/CartProvider';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function CartPage() {
  const { cart, updateCartItem, removeFromCart, applyCoupon, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      await applyCoupon(couponCode);
      setCouponCode('');
      toast.success('Coupon applied!');
    } catch (error) {
      toast.error('Invalid coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleUpdateQuantity = async (key: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeFromCart(key);
    } else {
      await updateCartItem(key, newQuantity);
    }
  };

  if (!cart || cart.contents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <ShoppingBag className="h-24 w-24 mx-auto text-gray-400 mb-6" />
            <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Link href="/products">
              <Button size="lg">
                <ArrowRight className="h-5 w-5 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cart.subtotal ?? 0;
  const shipping = cart.shipping_total ?? 0;
  const tax = cart.tax_total ?? 0;
  const total = cart.total ?? (subtotal + shipping + tax);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.contents.map(item => (
              <Card key={item.key}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Product Image */}
                    <div className="relative h-24 w-24 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                      {item.data?.image && (
                        <img
                          src={item.data.image.src}
                          alt={item.data.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                        {item.data?.name}
                      </h3>
                      {item.data?.variation && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.data.variation}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        {/* Quantity */}
                        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded">
                          <button
                            onClick={() => handleUpdateQuantity(item.key, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-4 py-1 font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.key, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Item total */}
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {formatCurrency((item.quantity * parseFloat(item.data?.price || '0')).toString())}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(item.data?.price || '0')} each
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCart(item.key)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Coupon */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleApplyCoupon}
                    isLoading={applyingCoupon}
                  >
                    Apply
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Clear Cart */}
            <div className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  clearCart();
                  toast.success('Cart cleared');
                }}
              >
                Clear Cart
              </Button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal.toString())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'Free' : formatCurrency(shipping.toString())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Tax</span>
                    <span className="font-medium">{formatCurrency(tax.toString())}</span>
                  </div>
                  {cart.discount_total && cart.discount_total > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-medium">-{formatCurrency(cart.discount_total)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatCurrency(total.toString())}
                    </span>
                  </div>
                </div>

                <Link href="/checkout" className="block">
                  <Button size="lg" className="w-full">
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>

                <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>Secure checkout powered by WooCommerce</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
