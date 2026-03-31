'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface CartItem {
  key: string;
  product_id: number;
  variation_id: number | null;
  quantity: number;
  data: any; // WooCommerce line item data
}

interface CartContextType {
  cart: {
    contents: CartItem[];
    total: number;
    subtotal: number;
    tax_total: number;
    shipping_total: number;
    contents_count: number;
  } | null;
  loading: boolean;
  addToCart: (productId: number, quantity?: number, variationId?: number) => Promise<void>;
  updateCartItem: (key: string, quantity: number) => Promise<void>;
  removeFromCart: (key: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: (code: string) => Promise<void>;
  calculateTotals: () => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  isInCart: (productId: number, variationId?: number | null) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Persist cart to localStorage
const CART_STORAGE_KEY = 'woo_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartContextType['cart']>(null);
  const [loading, setLoading] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse saved cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }
  }, [cart]);

  const refreshCart = useCallback(async () => {
    // In a real implementation, you would fetch cart from WooCommerce
    // via a custom endpoint or from localStorage
    // For now, we just keep localStorage cart
  }, []);

  const addToCart = useCallback(async (
    productId: number,
    quantity: number = 1,
    variationId: number | null = null
  ) => {
    setLoading(true);
    try {
      // In production, this would call a Next.js API route
      // that creates/updates cart in WooCommerce session

      // For demo, we'll simulate:
      const newItem: CartItem = {
        key: `${productId}-${variationId || ''}`,
        product_id: productId,
        variation_id: variationId,
        quantity,
        data: {
          product_id: productId,
          variation_id: variationId,
          quantity,
        },
      };

      setCart(prevCart => {
        if (!prevCart) {
          return {
            contents: [newItem],
            total: 0,
            subtotal: 0,
            tax_total: 0,
            shipping_total: 0,
            contents_count: quantity,
          };
        }

        const existingItem = prevCart.contents.find(
          item => item.product_id === productId && item.variation_id === variationId
        );

        let updatedContents;
        if (existingItem) {
          updatedContents = prevCart.contents.map(item =>
            item.key === newItem.key
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          updatedContents = [...prevCart.contents, newItem];
        }

        return {
          ...prevCart,
          contents: updatedContents,
          contents_count: updatedContents.reduce((sum, item) => sum + item.quantity, 0),
        };
      });

      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
      console.error('Add to cart error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCartItem = useCallback(async (key: string, quantity: number) => {
    setLoading(true);
    try {
      setCart(prevCart => {
        if (!prevCart) return prevCart;

        return {
          ...prevCart,
          contents: prevCart.contents.map(item =>
            item.key === key ? { ...item, quantity } : item
          ),
          contents_count: prevCart.contents.reduce((sum, item) =>
            sum + (item.key === key ? quantity : item.quantity), 0
          ),
        };
      });

      toast.success('Cart updated');
    } catch (error) {
      toast.error('Failed to update cart');
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromCart = useCallback(async (key: string) => {
    setLoading(true);
    try {
      setCart(prevCart => {
        if (!prevCart) return prevCart;

        return {
          ...prevCart,
          contents: prevCart.contents.filter(item => item.key !== key),
          contents_count: prevCart.contents.reduce((sum, item) =>
            sum + (item.key === key ? 0 : item.quantity), 0
          ),
        };
      });

      toast.success('Removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setLoading(false);
    }
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    toast.success(`Coupon "${code}" applied!`);
    // Would call WooCommerce coupon endpoint
  }, []);

  const removeCoupon = useCallback(async (code: string) => {
    toast.success(`Coupon "${code}" removed`);
    // Would call WooCommerce coupon delete endpoint
  }, []);

  const calculateTotals = useCallback(async () => {
    // Would calculate from WooCommerce cart API
    // For demo, just placeholder
  }, []);

  const clearCart = useCallback(() => {
    setCart(null);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const isInCart = useCallback((productId: number, variationId?: number | null) => {
    if (!cart) return false;
    return cart.contents.some(
      item => item.product_id === productId && item.variation_id === variationId
    );
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateCartItem,
        removeFromCart,
        applyCoupon,
        removeCoupon,
        calculateTotals,
        clearCart,
        refreshCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
