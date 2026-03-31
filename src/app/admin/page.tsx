'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/index';
import { formatCurrency } from '@/lib/utils';
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { woocommerce } from '@/lib/woocommerce/client';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockItems: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch products
      const products = await woocommerce.getProducts({ per_page: 100 });
      const lowStock = products.filter((p: any) => p.stock_quantity !== null && p.stock_quantity <= 10);
      const lowStockCount = lowStock.length;

      // Fetch orders
      const orders = await woocommerce.getOrders({ per_page: 5 });
      const allOrders = await woocommerce.getOrders({ per_page: 100 });
      const pendingOrders = allOrders.filter((o: any) => o.status === 'pending' || o.status === 'processing');
      const totalRevenue = allOrders.reduce((sum: number, o: any) => sum + parseFloat(o.total), 0);

      setStats({
        totalProducts: products.length,
        totalOrders: allOrders.length,
        totalRevenue,
        pendingOrders: pendingOrders.length,
        lowStockItems: lowStockCount,
      });

      setRecentOrders(orders);
      setLowStockProducts(lowStock.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runPriceCheck = async () => {
    try {
      await fetch('/api/cron/price-check', { method: 'POST' });
      alert('Price check triggered!');
    } catch (error) {
      console.error('Failed to trigger price check:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Overview of your store performance
          </p>
        </div>
        <Button onClick={runPriceCheck} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Check Prices
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts.toLocaleString()}</p>
              </div>
              <Package className="h-8 w-8 text-primary-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue.toString())}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold">{stats.lowStockItems}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No orders yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Order #</th>
                      <th className="text-left py-3 px-4">Customer</th>
                      <th className="text-right py-3 px-4">Total</th>
                      <th className="text-center py-3 px-4">Status</th>
                      <th className="text-right py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id} className="border-b">
                        <td className="py-3 px-4 font-medium">#{order.number}</td>
                        <td className="py-3 px-4 text-gray-600">{order.billing?.first_name} {order.billing?.last_name}</td>
                        <td className="py-3 px-4 text-right font-medium">{formatCurrency(order.total)}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              order.status === 'completed' || order.status === 'processing'
                                ? 'success'
                                : order.status === 'cancelled' || order.status === 'refunded'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {order.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-gray-500 py-8">All items well stocked</p>
            ) : (
              <div className="space-y-4">
                {lowStockProducts.map(product => (
                  <div key={product.id} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm truncate max-w-[200px]">{product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                      </div>
                      <Badge variant="warning">
                        {product.stock_quantity} left
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                      Threshold: {product.low_stock_amount || 10}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Price Monitoring Section */}
      <Card>
        <CardHeader>
          <CardTitle>Price Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Manual Price Check</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Check competitor prices and update your product pricing
              </p>
              <Button onClick={runPriceCheck} variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Run Price Check
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Price Drop Alerts</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                You have {priceAlerts.length} active price tracking alerts
              </p>
              <Button variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View Alerts
              </Button>
            </div>

            <div>
              <h3 className="font-semibold mb-2">AI Pricing Suggestions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Get AI-powered recommendations for optimal pricing
              </p>
              <Button variant="outline" className="w-full">
                Run AI Analysis
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
