'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
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
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/utils';
import {
  Bell,
  Mail,
  MessageSquare,
  RefreshCw,
  CheckCircle,
  XCircle,
  Send,
  Trash2,
  Eye,
} from 'lucide-react';
import { db } from '@/lib/db/client';
import { toast } from 'react-hot-toast';

interface Notification {
  id: number;
  user_id: number | null;
  type: 'email' | 'whatsapp' | 'in_app';
  channel: string;
  title: string;
  body: string;
  status: 'pending' | 'sent' | 'failed' | 'read';
  scheduled_for: string | null;
  sent_at: string | null;
  attempts: number;
  error_message: string | null;
  metadata: any;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const result = await db.getNotifications(params);
      setNotifications(result.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationStatus = async (id: number, status: string) => {
    try {
      await db.updateNotification(id, { status });
      toast.success('Notification updated');
      fetchNotifications();
      if (selectedNotification?.id === id) {
        setSelectedNotification({ ...selectedNotification, status: status as any });
      }
    } catch (error) {
      console.error('Failed to update notification:', error);
      toast.error('Failed to update notification');
    }
  };

  const retryNotification = async (id: number) => {
    toast.loading('Retry triggered');
    // In production, would:
    // 1. Update status to pending
    // 2. Trigger notification worker
  };

  const deleteNotification = async (id: number) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await db.deleteNotification(id);
      toast.success('Notification deleted');
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications;
  }, [notifications]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent':
        return 'success' as const;
      case 'failed':
        return 'danger' as const;
      case 'pending':
        return 'warning' as const;
      default:
        return 'default' as const;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'in_app':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'email':
        return 'primary' as const;
      case 'whatsapp':
        return 'success' as const;
      case 'in_app':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  const stats = useMemo(() => {
    return {
      total: notifications.length,
      sent: notifications.filter((n) => n.status === 'sent').length,
      pending: notifications.filter((n) => n.status === 'pending').length,
      failed: notifications.filter((n) => n.status === 'failed').length,
    };
  }, [notifications]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor and manage notification queue
          </p>
        </div>
        <Button onClick={fetchNotifications} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.sent}</p>
                <p className="text-sm text-gray-500">Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Send className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-sm text-gray-500">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="read">Read</option>
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="in_app">In-App</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center p-8 text-gray-500">No notifications found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(notification.type)}
                        <Badge variant={getTypeBadgeVariant(notification.type)}>
                          {notification.type}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {notification.title}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400 max-w-[300px] truncate">
                      {notification.body}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(notification.status)}>
                        {notification.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(notification.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{notification.attempts}</span>
                        {notification.status === 'failed' && notification.error_message && (
                          <span className="text-red-500" title={notification.error_message}>
                            ⚠️
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {notification.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryNotification(notification.id)}
                            title="Retry"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedNotification(notification)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          title="Delete"
                          className="text-red-600"
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

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title="Notification Details"
        size="md"
      >
        {selectedNotification && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant={getTypeBadgeVariant(selectedNotification.type)}>
                {selectedNotification.type}
              </Badge>
              <Badge variant={getStatusBadgeVariant(selectedNotification.status)}>
                {selectedNotification.status}
              </Badge>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Title</h4>
              <p className="text-gray-700 dark:text-gray-300">{selectedNotification.title}</p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Message</h4>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {selectedNotification.body}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm font-medium">
                  {formatDate(selectedNotification.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Sent</p>
                <p className="text-sm font-medium">
                  {selectedNotification.sent_at
                    ? formatDate(selectedNotification.sent_at)
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Scheduled For</p>
                <p className="text-sm font-medium">
                  {selectedNotification.scheduled_for
                    ? formatDate(selectedNotification.scheduled_for)
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Attempts</p>
                <p className="text-sm font-medium">{selectedNotification.attempts}</p>
              </div>
            </div>

            {selectedNotification.channel && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500">Channel</p>
                <p className="text-sm font-medium">{selectedNotification.channel}</p>
              </div>
            )}

            {selectedNotification.error_message && (
              <div className="border-t pt-4">
                <p className="text-sm text-red-600 font-semibold">Error</p>
                <p className="text-sm text-red-600">{selectedNotification.error_message}</p>
              </div>
            )}

            {selectedNotification.metadata && (
              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Metadata</p>
                <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(selectedNotification.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              {selectedNotification.status !== 'sent' && (
                <Button
                  onClick={() => updateNotificationStatus(selectedNotification.id, 'sent')}
                >
                  Mark as Sent
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
