'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const variants = {
      default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
      primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-200',
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';

// Helper for stock status badge
export const StockBadge = ({ stock, lowStockThreshold = 10 }: { stock: number; lowStockThreshold?: number }) => {
  if (stock === 0) {
    return <Badge variant="danger">Out of Stock</Badge>;
  }
  if (stock <= lowStockThreshold) {
    return <Badge variant="warning">Low Stock</Badge>;
  }
  return <Badge variant="success">In Stock</Badge>;
};

// Helper for order status badge
export const OrderStatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, BadgeProps['variant']> = {
    pending: 'warning',
    processing: 'primary',
    on_hold: 'warning',
    completed: 'success',
    cancelled: 'danger',
    refunded: 'danger',
    failed: 'danger',
  };

  return (
    <Badge variant={variants[status] || 'default'}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
};
