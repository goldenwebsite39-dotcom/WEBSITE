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
import {
  Modal,
  ConfirmDialog,
} from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { formatCurrency } from '@/lib/utils';
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  TrendingUp,
  History,
} from 'lucide-react';
import { woocommerce } from '@/lib/woocommerce/client';
import { db } from '@/lib/db/client';
import { toast } from 'react-hot-toast';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Product extends Record<string, any> {
  id: number;
  name: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price?: string;
  stock_quantity?: number;
  status: string;
  categories: Array<{ id: number; name: string }>;
  low_stock_amount?: number;
}

export default function ProductsAdminPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    price: '',
    regular_price: '',
    stock_quantity: '',
  });
  const [showPriceHistory, setShowPriceHistory] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, statusFilter, stockFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await woocommerce.getProducts({
        per_page: 100,
        status: statusFilter === 'all' ? undefined : (statusFilter as 'publish' | 'private' | 'draft'),
      });
      setProducts(data);
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query)
      );
    }

    if (stockFilter === 'low') {
      filtered = filtered.filter((p) => p.stock_quantity && p.stock_quantity <= (p.low_stock_amount || 10));
    } else if (stockFilter === 'out') {
      filtered = filtered.filter((p) => p.stock_quantity === 0);
    }

    setFilteredProducts(filtered);
  };

  const openEditModal = (product: Product) => {
    setEditProduct(product);
    setEditForm({
      price: product.price || '',
      regular_price: product.regular_price || product.price || '',
      stock_quantity: product.stock_quantity?.toString() || '0',
    });
  };

  const saveProduct = async () => {
    if (!editProduct) return;

    try {
      const updates: any = {};
      if (editForm.price !== editProduct.price) {
        updates.price = editForm.price;
      }
      if (editForm.regular_price !== editProduct.regular_price) {
        updates.regular_price = editForm.regular_price;
      }
      const newStock = parseInt(editForm.stock_quantity, 10);
      if (newStock !== editProduct.stock_quantity) {
        updates.stock_quantity = newStock;
      }

      if (Object.keys(updates).length > 0) {
        await woocommerce.updateProduct(editProduct.id, updates);
        toast.success('Product updated successfully');
        setEditProduct(null);
        fetchProducts();
      } else {
        toast('No changes to save');
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error('Failed to update product');
    }
  };

  const bulkUpdate = async (updates: { price?: string; stock_quantity?: number }) => {
    const selectedArray = Array.from(selectedProducts);
    if (selectedArray.length === 0) {
      toast.error('No products selected');
      return;
    }

    try {
      // Note: WooCommerce doesn't have native batch update, so we update one by one
      // In production, consider using wp-cli or a custom endpoint
      for (const productId of selectedArray) {
        await woocommerce.updateProduct(productId, updates);
      }
      toast.success(`Updated ${selectedArray.length} products`);
      setSelectedProducts(new Set());
      fetchProducts();
    } catch (error) {
      console.error('Bulk update failed:', error);
      toast.error('Bulk update failed');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;

    try {
      await woocommerce.deleteProduct(id, true);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    }
  };

  const fetchPriceHistory = async (productId: number) => {
    try {
      setHistoryLoading(true);
      const history = await db.getPriceHistory(productId);
      setPriceHistory(history);
    } catch (error) {
      console.error('Failed to fetch price history:', error);
      toast.error('Failed to load price history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleShowHistory = (productId: number) => {
    if (showPriceHistory === productId) {
      setShowPriceHistory(null);
      setPriceHistory([]);
    } else {
      setShowPriceHistory(productId);
      fetchPriceHistory(productId);
    }
  };

  const chartData = useMemo(() => {
    if (!priceHistory.length) return [];
    return priceHistory
      .slice()
      .reverse()
      .map((entry) => ({
        date: new Date(entry.created_at).toLocaleDateString(),
        ourPrice: parseFloat(entry.new_price),
        competitorPrice: parseFloat(entry.competitor_price),
        competitor: entry.competitor_name,
      }));
  }, [priceHistory]);

  const isLowStock = (product: Product) => {
    const threshold = product.low_stock_amount || 10;
    const stockQty = product.stock_quantity ?? 0;
    return stockQty <= threshold;
  };

  const isOutOfStock = (product: Product) => {
    const stockQty = product.stock_quantity ?? 0;
    return stockQty === 0;
  };

  const allSelected = filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length;
  const someSelected = selectedProducts.size > 0 && !allSelected;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your product catalog
          </p>
        </div>
        <Button onClick={() => toast('Create product form coming soon')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
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
                  placeholder="Search by name or SKU..."
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
              <option value="publish">Published</option>
              <option value="private">Private</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
            <Button variant="outline" onClick={fetchProducts} isLoading={loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <Card className="border-primary-200 dark:border-primary-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedProducts.size} product(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const ids = Array.from(selectedProducts);
                    bulkUpdate({ stock_quantity: 999 });
                  }}
                >
                  Mark In Stock
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const ids = Array.from(selectedProducts);
                    bulkUpdate({ stock_quantity: 0 });
                  }}
                >
                  Mark Out of Stock
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center p-8 text-gray-500">No products found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
                        } else {
                          setSelectedProducts(new Set());
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedProducts);
                          if (e.target.checked) {
                            newSet.add(product.id);
                          } else {
                            newSet.delete(product.id);
                          }
                          setSelectedProducts(newSet);
                        }}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          {product.categories?.[0]?.name || 'Uncategorized'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku || '-'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {product.sale_price && parseFloat(product.sale_price) < parseFloat(product.regular_price) && (
                          <>
                            <p className="text-xs text-gray-500 line-through">
                              {formatCurrency(product.regular_price)}
                            </p>
                            <p className="font-medium text-red-600 dark:text-red-400">
                              {formatCurrency(product.sale_price)}
                            </p>
                          </>
                        )}
                        {(!product.sale_price || parseFloat(product.sale_price) >= parseFloat(product.regular_price)) && (
                          <p className="font-medium">{formatCurrency(product.price)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={isLowStock(product) ? 'text-yellow-600 dark:text-yellow-400' : ''}>
                          {product.stock_quantity !== null ? product.stock_quantity : '∞'}
                        </span>
                        {isLowStock(product) && !isOutOfStock(product) && (
                          <Badge variant="warning" size="sm">Low</Badge>
                        )}
                        {isOutOfStock(product) && (
                          <Badge variant="danger" size="sm">Out</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.status === 'publish'
                            ? 'success'
                            : product.status === 'private'
                            ? 'default'
                            : 'warning'
                        }
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(product)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShowHistory(product.id)}
                          title="Price History"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                          title="Delete"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editProduct}
        onClose={() => setEditProduct(null)}
        title="Edit Product"
        description={editProduct?.name}
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              step="0.01"
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
            />
            <Input
              label="Regular Price"
              type="number"
              step="0.01"
              value={editForm.regular_price}
              onChange={(e) => setEditForm({ ...editForm, regular_price: e.target.value })}
            />
          </div>
          <div>
            <Input
              label="Stock Quantity"
              type="number"
              value={editForm.stock_quantity}
              onChange={(e) => setEditForm({ ...editForm, stock_quantity: e.target.value })}
              helperText="Set to 0 for out of stock"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setEditProduct(null)}>
            Cancel
          </Button>
          <Button onClick={saveProduct}>Save Changes</Button>
        </div>
      </Modal>

      {/* Price History Modal */}
      <Modal
        isOpen={showPriceHistory !== null}
        onClose={() => setShowPriceHistory(null)}
        title="Price History"
        description={
          showPriceHistory
            ? products.find((p) => p.id === showPriceHistory)?.name
            : ''
        }
        size="lg"
      >
        {historyLoading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : chartData.length > 0 ? (
          <div className="space-y-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="ourPrice"
                    stroke="#0ea5e9"
                    name="Our Price"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="competitorPrice"
                    stroke="#ef4444"
                    name="Competitor"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Recent Comparisons</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {priceHistory.slice(0, 10).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <div>
                      <p className="text-sm font-medium">{entry.competitor_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(entry.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">${entry.competitor_price}</p>
                      <p className={`text-xs ${parseFloat(entry.old_price) > parseFloat(entry.new_price) ? 'text-red-600' : 'text-green-600'}`}>
                        Ours: ${entry.old_price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No price history available yet. Run the price tracker to start collecting data.
          </p>
        )}
      </Modal>
    </div>
  );
}
