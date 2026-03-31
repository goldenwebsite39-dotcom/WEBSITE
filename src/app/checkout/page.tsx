'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Lock, Check, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCart } from '@/lib/context/CartProvider';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'shipping' | 'payment' | 'complete'>('shipping');
  const [formData, setFormData] = useState({
    // Customer
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    // Shipping
    shipping_address_1: '',
    shipping_address_2: '',
    shipping_city: '',
    shipping_state: '',
    shipping_postcode: '',
    shipping_country: 'US',
    // Billing
    billing_address_1: '',
    billing_address_2: '',
    billing_city: '',
    billing_state: '',
    billing_postcode: '',
    billing_country: 'US',
    // Payment
    payment_method: 'cod', // Cash on delivery for demo
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const copyShippingToBilling = () => {
    setFormData(prev => ({
      ...prev,
      billing_address_1: prev.shipping_address_1,
      billing_address_2: prev.shipping_address_2,
      billing_city: prev.shipping_city,
      billing_state: prev.shipping_state,
      billing_postcode: prev.shipping_postcode,
      billing_country: prev.shipping_country,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'shipping') {
      setStep('payment');
      return;
    }

    if (!cart) {
      toast.error('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      // Create order via WooCommerce API
      const orderData = {
        payment_method: formData.payment_method,
        payment_method_title: 'Cash on Delivery',
        set_paid: false,
        billing: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          address_1: formData.billing_address_1,
          address_2: formData.billing_address_2,
          city: formData.billing_city,
          state: formData.billing_state,
          postcode: formData.billing_postcode,
          country: formData.billing_country,
          email: formData.email,
          phone: formData.phone,
        },
        shipping: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          address_1: formData.shipping_address_1,
          address_2: formData.shipping_address_2,
          city: formData.shipping_city,
          state: formData.shipping_state,
          postcode: formData.shipping_postcode,
          country: formData.shipping_country,
          phone: formData.phone,
        },
        line_items: cart.contents.map(item => ({
          product_id: item.product_id,
          variation_id: item.variation_id || undefined,
          quantity: item.quantity,
        })),
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const order = await response.json();
      clearCart();
      setStep('complete');
      toast.success('Order placed successfully!');
    } catch (error) {
      toast.error('Failed to complete checkout');
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.contents.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Cart is empty</h1>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = cart?.subtotal ?? 0;

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Thank you for your order. We'll send you a confirmation email shortly.
          </p>
          <div className="space-y-2">
            <Link href="/account/orders">
              <Button variant="outline" className="w-full">
                View Orders
              </Button>
            </Link>
            <Link href="/products">
              <Button className="w-full">Continue Shopping</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'shipping' || step === 'payment' ? 'bg-primary-600 text-white' : 'bg-green-600 text-white'}`}>
              {step === 'payment' ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <span className="ml-2 font-medium">Shipping</span>
          </div>
          <div className="w-16 h-1 mx-4 bg-gray-300 dark:bg-gray-700">
            <div className={`h-full ${step === 'payment' ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
          </div>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
              {step === 'payment' ? <Check className="h-4 w-4" /> : '2'}
            </div>
            <span className="ml-2 font-medium">Payment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit}>
                  {step === 'shipping' && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                          <Input
                            label="Phone"
                            name="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                          />
                        </div>
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 grid grid-cols-2 gap-4">
                            <Input
                              label="First Name"
                              name="first_name"
                              value={formData.first_name}
                              onChange={handleChange}
                              required
                            />
                            <Input
                              label="Last Name"
                              name="last_name"
                              value={formData.last_name}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Input
                              label="Address"
                              name="shipping_address_1"
                              value={formData.shipping_address_1}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <Input
                            label="Apartment, suite, etc."
                            name="shipping_address_2"
                            value={formData.shipping_address_2}
                            onChange={handleChange}
                          />
                          <Input
                            label="City"
                            name="shipping_city"
                            value={formData.shipping_city}
                            onChange={handleChange}
                            required
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label="State"
                              name="shipping_state"
                              value={formData.shipping_state}
                              onChange={handleChange}
                              required
                            />
                            <Input
                              label="ZIP Code"
                              name="shipping_postcode"
                              value={formData.shipping_postcode}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <Input
                            label="Country"
                            name="shipping_country"
                            value={formData.shipping_country}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="copy_address"
                          onChange={copyShippingToBilling}
                          className="mr-2"
                        />
                        <label htmlFor="copy_address">Billing address same as shipping</label>
                      </div>

                      <Button type="submit" size="lg" className="w-full">
                        Continue to Payment
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  )}

                  {step === 'payment' && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-xl font-semibold mb-4">Billing Address</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2 grid grid-cols-2 gap-4">
                            <Input
                              label="First Name"
                              name="first_name"
                              value={formData.first_name}
                              onChange={handleChange}
                              required
                            />
                            <Input
                              label="Last Name"
                              name="last_name"
                              value={formData.last_name}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Input
                              label="Address"
                              name="billing_address_1"
                              value={formData.billing_address_1}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <Input
                            label="Apartment, suite, etc."
                            name="billing_address_2"
                            value={formData.billing_address_2}
                            onChange={handleChange}
                          />
                          <Input
                            label="City"
                            name="billing_city"
                            value={formData.billing_city}
                            onChange={handleChange}
                            required
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              label="State"
                              name="billing_state"
                              value={formData.billing_state}
                              onChange={handleChange}
                              required
                            />
                            <Input
                              label="ZIP Code"
                              name="billing_postcode"
                              value={formData.billing_postcode}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <Input
                            label="Country"
                            name="billing_country"
                            value={formData.billing_country}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                        <div className="space-y-4">
                          <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                            <input
                              type="radio"
                              name="payment_method"
                              value="cod"
                              checked={formData.payment_method === 'cod'}
                              onChange={handleChange}
                              className="mr-3"
                            />
                            <div>
                              <p className="font-medium">Cash on Delivery</p>
                              <p className="text-sm text-gray-500">Pay when you receive your order</p>
                            </div>
                          </label>
                          <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                            <input
                              type="radio"
                              name="payment_method"
                              value="bacs"
                              checked={formData.payment_method === 'bacs'}
                              onChange={handleChange}
                              className="mr-3"
                            />
                            <div>
                              <p className="font-medium">Direct Bank Transfer</p>
                              <p className="text-sm text-gray-500">Pay directly to our bank account</p>
                            </div>
                          </label>
                          <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                            <input
                              type="radio"
                              name="payment_method"
                              value="stripe"
                              checked={formData.payment_method === 'stripe'}
                              onChange={handleChange}
                              className="mr-3"
                            />
                            <div>
                              <p className="font-medium">Credit Card (Stripe)</p>
                              <p className="text-sm text-gray-500">Secure payment via Stripe</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep('shipping')}
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          size="lg"
                          className="flex-1"
                          isLoading={loading}
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Place Order - {formatCurrency((cart.total || subtotal).toString())}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {cart.contents.map(item => (
                    <div key={item.key} className="flex items-center space-x-3">
                      <div className="relative h-12 w-12 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                        {item.data?.image && (
                          <img
                            src={item.data.image.src}
                            alt={item.data.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.data?.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium">
                        {formatCurrency((item.quantity * parseFloat(item.data?.price || '0')).toString())}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatCurrency(subtotal.toString())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span>Calculated next step</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">{formatCurrency(subtotal.toString())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
