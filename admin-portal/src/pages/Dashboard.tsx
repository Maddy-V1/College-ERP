// ============================================
// Admin Portal - Dashboard Page
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap,
    Users,
    Building2,
    BookOpen,
    Plus,
    Clock,
    ArrowUpRight,
    Activity,
    TrendingUp,
    Bell,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ============================================
// Supabase Client
// ============================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// ============================================
// Types
// ============================================

interface DashboardStats {
    totalStudents: number;
    totalProfessors: number;
    totalBatches: number;
    totalSubjects: number;
}

interface AuditLog {
    id: string;
    table_name: string;
    action_type: string;
    changed_at: string;
    changed_by: string | null;
}

// ============================================
// Stat Card Component
// ============================================

function StatCard({
    label,
    value,
    icon: Icon,
    color,
    trend,
    loading,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    trend?: number;
    loading?: boolean;
}) {
    const colorClasses: Record<string, string> = {
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/10 text-secondary',
        teal: 'bg-accent-teal/10 text-accent-teal',
        orange: 'bg-accent-orange/10 text-accent-orange',
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 backdrop-blur-xl border border-white/10 rounded-xl p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5" />
                    <div className="w-16 h-4 rounded bg-white/5" />
                </div>
                <div className="w-20 h-8 rounded bg-white/5 mb-2" />
                <div className="w-24 h-4 rounded bg-white/5" />
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all duration-300 group">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend !== undefined && (
                    <div className="flex items-center gap-1 text-sm text-success">
                        <TrendingUp className="w-4 h-4" />
                        <span>+{trend}%</span>
                    </div>
                )}
            </div>
            <p className="text-3xl font-bold text-text-primary mb-1 group-hover:text-primary transition-colors">
                {value.toLocaleString()}
            </p>
            <p className="text-text-secondary text-sm">{label}</p>
        </div>
    );
}

// ============================================
// Quick Action Button
// ============================================

function QuickAction({
    label,
    icon: Icon,
    onClick,
    color,
}: {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        primary: 'hover:border-primary/50 hover:bg-primary/5',
        secondary: 'hover:border-secondary/50 hover:bg-secondary/5',
        teal: 'hover:border-accent-teal/50 hover:bg-accent-teal/5',
        orange: 'hover:border-accent-orange/50 hover:bg-accent-orange/5',
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl text-left transition-all duration-200 group ${colorClasses[color]}`}
        >
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-text-secondary" />
            </div>
            <div className="flex-1">
                <p className="font-medium text-text-primary">{label}</p>
                <p className="text-xs text-text-muted">Click to create</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
        </button>
    );
}

// ============================================
// Activity Item
// ============================================

function ActivityItem({ log }: { log: AuditLog }) {
    const actionColors: Record<string, string> = {
        INSERT: 'bg-success/20 text-success',
        UPDATE: 'bg-warning/20 text-warning',
        DELETE: 'bg-error/20 text-error',
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <Activity className="w-5 h-5 text-text-muted" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${actionColors[log.action_type] || 'bg-white/10 text-text-secondary'}`}>
                        {log.action_type}
                    </span>
                    <span className="ml-2">on <span className="font-medium">{log.table_name}</span></span>
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                    {log.changed_by ? `By user ${log.changed_by.slice(0, 8)}...` : 'System action'}
                </p>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-muted">
                <Clock className="w-3 h-3" />
                {formatTime(log.changed_at)}
            </div>
        </div>
    );
}

// ============================================
// Dashboard Page
// ============================================

export default function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        totalStudents: 0,
        totalProfessors: 0,
        totalBatches: 0,
        totalSubjects: 0,
    });
    const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch dashboard data
    useEffect(() => {
        const fetchData = async () => {
            if (!supabase) {
                // Mock data if Supabase not configured
                setStats({
                    totalStudents: 1234,
                    totalProfessors: 56,
                    totalBatches: 4,
                    totalSubjects: 24,
                });
                setRecentActivity([]);
                setLoading(false);
                return;
            }

            try {
                // Fetch counts in parallel
                const [studentsRes, professorsRes, batchesRes, subjectsRes, activityRes] = await Promise.all([
                    supabase.from('student_profiles').select('id', { count: 'exact', head: true }),
                    supabase.from('professor_profiles').select('id', { count: 'exact', head: true }),
                    supabase.from('batches').select('id', { count: 'exact', head: true }),
                    supabase.from('subjects').select('id', { count: 'exact', head: true }).eq('is_active', true),
                    supabase.from('audit_logs').select('*').order('changed_at', { ascending: false }).limit(10),
                ]);

                setStats({
                    totalStudents: studentsRes.count || 0,
                    totalProfessors: professorsRes.count || 0,
                    totalBatches: batchesRes.count || 0,
                    totalSubjects: subjectsRes.count || 0,
                });

                setRecentActivity(activityRes.data || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const quickActions = [
        { label: 'Add Student', icon: GraduationCap, path: '/students/new', color: 'primary' },
        { label: 'Add Professor', icon: Users, path: '/professors/new', color: 'secondary' },
        { label: 'Send Notification', icon: Bell, path: '/notifications', color: 'teal' },
        { label: 'Add Subject', icon: BookOpen, path: '/subjects', color: 'orange' },
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
                    <p className="text-text-secondary mt-1">Welcome back! Here's what's happening.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/notifications')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent-teal to-primary text-white font-semibold rounded-lg shadow-glow-teal hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-200"
                    >
                        <Bell className="w-4 h-4" />
                        <span className="hidden sm:inline">Send Notification</span>
                    </button>
                    <button
                        onClick={() => navigate('/students/new')}
                        className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg shadow-glow-indigo hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-200"
                    >
                        <Plus className="w-4 h-4" />
                        Add New
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Students"
                    value={stats.totalStudents}
                    icon={GraduationCap}
                    color="primary"
                    trend={12}
                    loading={loading}
                />
                <StatCard
                    label="Total Professors"
                    value={stats.totalProfessors}
                    icon={Users}
                    color="secondary"
                    trend={5}
                    loading={loading}
                />
                <StatCard
                    label="Active Batches"
                    value={stats.totalBatches}
                    icon={Building2}
                    color="teal"
                    loading={loading}
                />
                <StatCard
                    label="Total Subjects"
                    value={stats.totalSubjects}
                    icon={BookOpen}
                    color="orange"
                    loading={loading}
                />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            {quickActions.map((action) => (
                                <QuickAction
                                    key={action.label}
                                    label={action.label}
                                    icon={action.icon}
                                    color={action.color}
                                    onClick={() => navigate(action.path)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-text-primary">Recent Activity</h2>
                            <button className="text-sm text-primary hover:text-primary-light transition-colors">
                                View All
                            </button>
                        </div>

                        {loading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 animate-pulse">
                                        <div className="w-10 h-10 rounded-full bg-white/5" />
                                        <div className="flex-1">
                                            <div className="w-48 h-4 rounded bg-white/5 mb-2" />
                                            <div className="w-24 h-3 rounded bg-white/5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : recentActivity.length > 0 ? (
                            <div>
                                {recentActivity.map((log) => (
                                    <ActivityItem key={log.id} log={log} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Activity className="w-12 h-12 text-text-muted mx-auto mb-3" />
                                <p className="text-text-secondary">No recent activity</p>
                                <p className="text-text-muted text-sm mt-1">Actions will appear here once you start using the system</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
