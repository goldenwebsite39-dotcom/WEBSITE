'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  Eye,
  Settings,
  Activity,
  Globe,
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
  Legend,
} from 'recharts';

// UAE Competitors configuration
const COMPETITORS = [
  { name: 'MindTech', url: 'https://mindtech.ae', active: true },
  { name: 'Adarc Computer', url: 'https://adarc.ae', active: true },
  { name: 'GCC Gamers', url: 'https://gccgamers.com', active: true },
  { name: 'Sharaf DG', url: 'https://sharafdg.com', active: true },
  { name: 'Switch Electronics', url: 'https://switchelectronics.ae', active: true },
];

interface PriceHistoryEntry {
  id: number;
  product_id: number;
  old_price: number;
  new_price: number;
  competitor_name: string;
  competitor_url: string;
  competitor_price: number;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: string;
  regular_price: string;
}

export default function PriceTrackingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productHistory, setProductHistory] = useState<PriceHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState(10);
  const [settings, setSettings] = useState({ alert_threshold: 10 });
  const [showSettings, setShowSettings] = useState(false);
  const [competitors, setCompetitors] = useState(COMPETITORS);

  useEffect(() => {
    fetchProducts();
    fetchRecentPriceAlerts();
    fetchSettings();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await woocommerce.getProducts({
        per_page: 100,
        status: 'publish',
      });
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentPriceAlerts = async () => {
    try {
      // Fetch price history for a few products (in production, create dedicated endpoint)
      const allHistory: PriceHistoryEntry[] = [];
      if (products.length > 0) {
        for (const product of products.slice(0, 5)) {
          // limited for demo
          const h = await db.getPriceHistory(product.id);
          allHistory.push(...h);
        }
      }
      // Sort by date
      allHistory.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setPriceHistory(allHistory.slice(0, 50));
    } catch (error) {
      console.error('Failed to fetch price alerts:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const s = await db.getSettings();
      setSettings(s);
      if (s.alert_threshold) {
        setAlertThreshold(parseFloat(s.alert_threshold));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const runPriceCheck = async () => {
    try {
      setTrackingLoading(true);
      const response = await fetch('/api/cron/price-check', {
        method: 'POST',
        headers: {
          'X-Cron-Secret': process.env.CRON_SECRET || '',
        },
      });

      if (!response.ok) {
        throw new Error('Price check failed');
      }

      const result = await response.json();
      toast.success(
        `Price check completed: ${result.productsChecked} products checked, ${result.alertsSent} alerts sent`
      );
      fetchRecentPriceAlerts();
    } catch (error) {
      console.error('Price check failed:', error);
      toast.error('Failed to run price check');
    } finally {
      setTrackingLoading(false);
    }
  };

  const viewProductHistory = async (product: Product) => {
    setSelectedProduct(product);
    setHistoryLoading(true);
    try {
      const history = await db.getPriceHistory(product.id);
      setProductHistory(history);
    } catch (error) {
      console.error('Failed to fetch product history:', error);
      toast.error('Failed to load price history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await db.updateSettings({
        wce_alert_threshold_price: alertThreshold.toString(),
      });
      toast.success('Settings saved');
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const chartData = useMemo(() => {
    if (!productHistory.length) return [];
    return productHistory
      .slice()
      .reverse()
      .map((entry) => ({
        date: new Date(entry.created_at).toLocaleDateString(),
        ourPrice: entry.old_price,
        competitorPrice: entry.competitor_price,
        competitor: entry.competitor_name,
      }));
  }, [productHistory]);

  const recentAlerts = useMemo(() => {
    return priceHistory.filter(
      (h) => ((h.old_price - h.new_price) / h.new_price) * 100 > alertThreshold
    );
  }, [priceHistory, alertThreshold]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Price Tracking</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor competitor prices and receive alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowSettings(true)}
            variant="outline"
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={runPriceCheck} isLoading={trackingLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Prices Now
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Active Competitors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary-600">
              {competitors.filter((c) => c.active).length}
            </div>
            <p className="text-sm text-gray-500">
              UAE retailers monitored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{recentAlerts.length}</div>
            <p className="text-sm text-gray-500">
              Price drops detected ({alertThreshold}%+)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alert Threshold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{alertThreshold}%</div>
            <p className="text-sm text-gray-500">
              Difference trigger
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Competitors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Monitored Competitors
          </CardTitle>
          <CardDescription>
            Price comparison across UAE retailers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitors.map((competitor) => (
              <div
                key={competitor.name}
                className="p-4 border rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{competitor.name}</p>
                  <p className="text-xs text-gray-500 truncate">{competitor.url}</p>
                </div>
                <Badge variant={competitor.active ? 'success' : 'default'}>
                  {competitor.active ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Price Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
            Recent Price Alerts
          </CardTitle>
          <CardDescription>
            Competitor prices lower than yours by {alertThreshold}% or more
          </CardDescription>
        </CardHeader>
        <CardContent>
          {priceHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No price alerts yet. Run the price checker to start monitoring.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Competitor</TableHead>
                  <TableHead className="text-right">Our Price</TableHead>
                  <TableHead className="text-right">Competitor</TableHead>
                  <TableHead className="text-center">Diff</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAlerts.slice(0, 20).map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {products.find((p) => p.id === alert.product_id)?.name || `Product #${alert.product_id}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{alert.competitor_name}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(alert.old_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(alert.competitor_price)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="danger">
                        {(
                          ((alert.old_price - alert.competitor_price) / alert.competitor_price) *
                          100
                        ).toFixed(1)}
                        %
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewProductHistory(products.find((p) => p.id === alert.product_id) || { id: alert.product_id, name: 'Product', sku: '', price: '', regular_price: '' })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Price History Chart Modal */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Price History"
        description={selectedProduct?.name}
        size="xl"
      >
        {historyLoading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : productHistory.length > 0 ? (
          <div className="space-y-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ourPrice"
                    stroke="#0ea5e9"
                    name="Our Price"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="competitorPrice"
                    stroke="#ef4444"
                    name="Competitor"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3 flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Price Comparison History
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {productHistory.map((entry) => {
                  const diff = ((entry.old_price - entry.competitor_price) / entry.competitor_price) * 100;
                  const isAlert = Math.abs(diff) >= alertThreshold;
                  return (
                    <div
                      key={entry.id}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        isAlert ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-sm">{entry.competitor_name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(entry.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(entry.competitor_price)}
                        </p>
                        <p className={`text-xs ${diff > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}% {diff > 0 ? 'higher' : 'lower'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No price history for this product yet.
          </p>
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Price Tracker Settings"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Alert Threshold (%)</label>
            <Input
              type="number"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(parseFloat(e.target.value) || 10)}
              helperText="Send alerts when our price exceeds competitor by this percentage"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Active Competitors</label>
            <div className="space-y-2">
              {competitors.map((competitor) => (
                <div key={competitor.name} className="flex items-center justify-between">
                  <span className="text-sm">{competitor.name}</span>
                  <Switch
                    checked={competitor.active}
                    onChange={(checked) => {
                      setCompetitors(
                        competitors.map((c) =>
                          c.name === competitor.name ? { ...c, active: checked } : c
                        )
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings}>Save Settings</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
