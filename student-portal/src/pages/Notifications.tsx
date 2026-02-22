// ============================================
// Student Portal - Notifications Page
// ============================================

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Calendar, BookOpen, AlertCircle, Megaphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.VITE_ACADEMIC_API_URL || 'http://localhost:4000/api/academic/v1';

interface Notification {
    id: string;
    title: string;
    message: string;
    notification_type: string;
    is_read: boolean;
    created_at: string;
}

const NOTIFICATION_ICONS: Record<string, any> = {
    general: Megaphone,
    academic: BookOpen,
    event: Calendar,
    urgent: AlertCircle,
    assignment: BookOpen,
    marks: CheckCheck
};

const NOTIFICATION_COLORS: Record<string, string> = {
    general: 'text-blue-500',
    academic: 'text-accent-teal',
    event: 'text-purple-500',
    urgent: 'text-error',
    assignment: 'text-primary',
    marks: 'text-success'
};

export default function Notifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        if (user?.id) {
            fetchNotifications();
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const res = await fetch(`${API_BASE}/notifications/student/${user?.id}`);
            const data = await res.json();
            // Ensure data is an array
            setNotifications(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
                method: 'PATCH'
            });
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch(`${API_BASE}/notifications/student/${user?.id}/read-all`, {
                method: 'PATCH'
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.is_read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-bg-primary pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-accent-teal to-primary p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Bell className="w-6 h-6" />
                            Notifications
                        </h1>
                        <p className="text-white/80 mt-1">
                            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllAsRead}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
                        >
                            Mark all as read
                        </button>
                    )}
                </div>
            </div>

            <div className="p-4">
                {/* Filter Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setFilter('all')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            filter === 'all'
                                ? 'bg-accent-teal text-white'
                                : 'bg-bg-secondary text-text-secondary'
                        }`}
                    >
                        All ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            filter === 'unread'
                                ? 'bg-accent-teal text-white'
                                : 'bg-bg-secondary text-text-secondary'
                        }`}
                    >
                        Unread ({unreadCount})
                    </button>
                </div>

                {/* Notifications List */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-2 border-accent-teal border-t-transparent rounded-full" />
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                        <Bell className="w-16 h-16 text-text-muted mx-auto mb-4" />
                        <p className="text-text-secondary">
                            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map(notification => {
                            const Icon = NOTIFICATION_ICONS[notification.notification_type] || Bell;
                            const iconColor = NOTIFICATION_COLORS[notification.notification_type] || 'text-text-muted';

                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                                    className={`glass-card p-4 cursor-pointer transition-all ${
                                        !notification.is_read ? 'border-l-4 border-accent-teal' : ''
                                    }`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center ${iconColor}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className={`font-semibold ${!notification.is_read ? 'text-text-primary' : 'text-text-secondary'}`}>
                                                    {notification.title}
                                                </h3>
                                                {!notification.is_read && (
                                                    <div className="w-2 h-2 bg-accent-teal rounded-full flex-shrink-0 mt-2" />
                                                )}
                                            </div>
                                            <p className="text-sm text-text-secondary mb-2 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-text-muted">
                                                <span className="capitalize">{notification.notification_type}</span>
                                                <span>•</span>
                                                <span>{formatDate(notification.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
