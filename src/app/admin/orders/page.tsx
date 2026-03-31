'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ShoppingCart,
  Search,
  Eye,
  RefreshCw,
  ChevronRight,
  User,
  MapPin,
  Package,
} from 'lucide-react';
import { woocommerce } from '@/lib/woocommerce/client';
import { toast } from 'react-hot-toast';

interface Order {
  id: number;
  number: string;
  status: string;
  total: string;
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address_1?: string;
    city?: string;
    country?: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1?: string;
    city?: string;
    country?: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    quantity: number;
    total: string;
    product_id: number;
  }>;
  date_created: string;
  date_modified: string;
  payment_method_title?: string;
  customer_note?: string;
}

export default function OrdersAdminPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await woocommerce.getOrders({
        per_page: 100,
        order: 'desc',
        orderby: 'date',
      });
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.number.toLowerCase().includes(query) ||
          o.billing?.first_name?.toLowerCase().includes(query) ||
          o.billing?.last_name?.toLowerCase().includes(query) ||
          o.billing?.email?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await woocommerce.updateOrder(orderId, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const orderStatusOptions: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Pending', variant: 'warning' },
    processing: { label: 'Processing', variant: 'primary' },
    on_hold: { label: 'On Hold', variant: 'warning' },
    completed: { label: 'Completed', variant: 'success' },
    cancelled: { label: 'Cancelled', variant: 'danger' },
    refunded: { label: 'Refunded', variant: 'danger' },
    failed: { label: 'Failed', variant: 'danger' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage customer orders
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline" isLoading={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search order #, customer name, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              {Object.entries(orderStatusOptions).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center p-8 text-gray-500">No orders found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const statusInfo = orderStatusOptions[order.status] || { label: order.status, variant: 'default' as const };
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.number}</TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(order.date_created)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {order.billing?.first_name} {order.billing?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{order.billing?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.line_items?.length || 0} item(s)
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order #${selectedOrder?.number}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <Badge
                  variant={orderStatusOptions[selectedOrder.status]?.variant || 'default'}
                >
                  {orderStatusOptions[selectedOrder.status]?.label || selectedOrder.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Payment</p>
                <p className="font-medium">{selectedOrder.payment_method_title || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                <p className="font-bold text-lg">{formatCurrency(selectedOrder.total)}</p>
              </div>
            </div>

            {/* Customer */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Customer
              </h4>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">
                    {selectedOrder.billing?.first_name} {selectedOrder.billing?.last_name}
                  </span>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedOrder.billing?.email}
                </p>
                {selectedOrder.billing?.phone && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedOrder.billing.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Shipping Address
              </h4>
              <div className="text-sm space-y-1">
                <p>
                  {selectedOrder.shipping?.first_name} {selectedOrder.shipping?.last_name}
                </p>
                {selectedOrder.shipping?.address_1 && <p>{selectedOrder.shipping.address_1}</p>}
                {selectedOrder.shipping?.city && (
                  <p>
                    {selectedOrder.shipping.city}, {selectedOrder.shipping.country}
                  </p>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Items ({selectedOrder.line_items?.length || 0})
              </h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.line_items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Status Update */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(orderStatusOptions).map(([key, { label }]) => (
                  <Button
                    key={key}
                    variant={
                      selectedOrder.status === key ? 'primary' : 'outline'
                    }
                    size="sm"
                    onClick={() => updateOrderStatus(selectedOrder.id, key)}
                    disabled={updatingStatus === selectedOrder.id || selectedOrder.status === key}
                    isLoading={updatingStatus === selectedOrder.id}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Customer Note */}
            {selectedOrder.customer_note && (
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Customer Note</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  {selectedOrder.customer_note}
                </p>
              </div>
            )}

            <div className="border-t pt-4 text-xs text-gray-500">
              <p>Order placed: {formatDate(selectedOrder.date_created)}</p>
              <p>Last updated: {formatDate(selectedOrder.date_modified)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
