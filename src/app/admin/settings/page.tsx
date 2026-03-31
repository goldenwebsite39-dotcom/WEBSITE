'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'react-hot-toast';
import { Save } from 'lucide-react';
import { db } from '@/lib/db/client';

interface PluginSettings {
  wce_price_check_interval: string;
  wce_competitor_websites: string;
  wce_alert_threshold_price: string;
  wce_low_stock_threshold: string;
  wce_notification_emails: string;
  wce_enable_whatsapp: string;
  wce_ai_confidence_threshold: string;
  wce_cron_secret: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PluginSettings>({
    wce_price_check_interval: '6',
    wce_competitor_websites: '',
    wce_alert_threshold_price: '10',
    wce_low_stock_threshold: '10',
    wce_notification_emails: '',
    wce_enable_whatsapp: '0',
    wce_ai_confidence_threshold: '85',
    wce_cron_secret: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await db.getSettings();
      setSettings({
        wce_price_check_interval: data.wce_price_check_interval || '6',
        wce_competitor_websites: data.wce_competitor_websites || '',
        wce_alert_threshold_price: data.wce_alert_threshold_price || '10',
        wce_low_stock_threshold: data.wce_low_stock_threshold || '10',
        wce_notification_emails: data.wce_notification_emails || '',
        wce_enable_whatsapp: data.wce_enable_whatsapp || '0',
        wce_ai_confidence_threshold: data.wce_ai_confidence_threshold || '85',
        wce_cron_secret: data.wce_cron_secret || '',
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: keyof PluginSettings, value: string) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Convert PluginSettings to Record<string, string>
      const settingsRecord: Record<string, string> = {};
      Object.keys(settings).forEach((key) => {
        settingsRecord[key] = settings[key as keyof PluginSettings];
      });
      await db.updateSettings(settingsRecord);
      toast.success('Settings saved successfully');

      // Reload settings to reflect any server-side changes
      fetchSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const generateCronSecret = () => {
    const secret = Math.random().toString(36).substring(2, 34) + Math.random().toString(36).substring(2, 34);
    setSettings({ ...settings, wce_cron_secret: secret });
  };

  const competitors = [
    'MindTech (https://mindtech.ae)',
    'Adarc Computer (https://adarc.ae)',
    'GCC Gamers (https://gccgamers.com)',
    'Sharaf DG (https://sharafdg.com)',
    'Switch Electronics (https://switchelectronics.ae)',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure price tracking, notifications, and cron jobs
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Price Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Price Tracking</CardTitle>
              <CardDescription>
                Configure automatic competitor price monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Check Interval (hours)
                </label>
                <Input
                  type="number"
                  value={settings.wce_price_check_interval}
                  onChange={(e) => handleChange('wce_price_check_interval', e.target.value)}
                  helperText="How often to run price checks (via cron)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Alert Threshold (%)
                </label>
                <Input
                  type="number"
                  value={settings.wce_alert_threshold_price}
                  onChange={(e) => handleChange('wce_alert_threshold_price', e.target.value)}
                  helperText="Send alert when our price exceeds competitor by this percentage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Competitor Websites
                </label>
                <textarea
                  value={settings.wce_competitor_websites}
                  onChange={(e) => handleChange('wce_competitor_websites', e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Enter one URL per line"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended competitors (UAE market):
                </p>
                <ul className="text-xs text-gray-500 mt-1 space-y-1">
                  {competitors.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure email and WhatsApp alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Admin Notification Emails
                </label>
                <Input
                  type="text"
                  value={settings.wce_notification_emails}
                  onChange={(e) => handleChange('wce_notification_emails', e.target.value)}
                  helperText="Comma-separated list of admin emails"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable WhatsApp Notifications</p>
                  <p className="text-sm text-gray-500">
                    Send urgent alerts via Twilio WhatsApp
                  </p>
                </div>
                <Switch
                  checked={settings.wce_enable_whatsapp === '1'}
                  onChange={(checked) =>
                    handleChange('wce_enable_whatsapp', checked ? '1' : '0')
                  }
                />
              </div>

              {settings.wce_enable_whatsapp === '1' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Admin WhatsApp Number
                  </label>
                  <Input
                    type="text"
                    value={process.env.ADMIN_WHATSAPP || ''}
                    placeholder="+971501234567"
                    helperText="E.164 format (include country code)"
                    disabled // Controlled by env var, not stored in DB
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>AI Pricing</CardTitle>
              <CardDescription>
                Configure automated pricing suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confidence Threshold (%)
                </label>
                <Input
                  type="number"
                  value={settings.wce_ai_confidence_threshold}
                  onChange={(e) => handleChange('wce_ai_confidence_threshold', e.target.value)}
                  helperText="Only apply AI suggestions with confidence above this threshold"
                />
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium mb-1">OpenAI API Key</p>
                <p className="text-xs text-gray-500">
                  {process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not set'}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Set OPENAI_API_KEY in your environment variables
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cron Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Cron Configuration</CardTitle>
              <CardDescription>
                Configure cron job secret for API endpoints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cron Secret
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={settings.wce_cron_secret}
                    onChange={(e) => handleChange('wce_cron_secret', e.target.value)}
                    disabled
                    helperText="Used to secure cron endpoints (auto-generated)"
                  />
                  <Button onClick={generateCronSecret} variant="outline">
                    Regenerate
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use this secret in the X-Cron-Secret header for API endpoints
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Vercel Cron Setup
                </p>
                <code className="text-xs block bg-white dark:bg-gray-900 p-3 rounded">
                  {`{
  "crons": [
    {
      "path": "/api/cron/price-check",
      "schedule": "0 */${settings.wce_price_check_interval || '6'} * * *"
    },
    {
      "path": "/api/cron/inventory-check",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/ai-pricing",
      "schedule": "0 10 * * *"
    }
  ]
}`}
                </code>
              </div>
            </CardContent>
          </Card>

          {/* Save */}
          <div className="flex justify-end">
            <Button onClick={handleSave} isLoading={saving} size="lg">
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
