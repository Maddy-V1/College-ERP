// ============================================
// Admin Portal - Layout Component
// ============================================

import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Settings,
    Bell,
    Menu,
    X,
    LogOut,
    ChevronRight,
    Layers,
    BookText,
    Building2,
} from 'lucide-react';

// ============================================
// Sidebar Navigation Items
// ============================================

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/professors', icon: Users, label: 'Professors' },
    { path: '/students', icon: GraduationCap, label: 'Students' },
    { path: '/courses', icon: BookOpen, label: 'Courses' },
    { path: '/batches', icon: Layers, label: 'Batches' },
    { path: '/classes', icon: Building2, label: 'Classes' },
    { path: '/subjects', icon: BookText, label: 'Subjects' },
    { path: '/notifications', icon: Bell, label: 'Send Notification' },
    { path: '/settings', icon: Settings, label: 'Settings' },
];

// ============================================
// Layout Component
// ============================================

export function Layout() {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Get current page title for breadcrumb
    const currentPage = navItems.find((item) => location.pathname.startsWith(item.path));

    return (
        <div className="min-h-screen bg-bg-primary flex">
            {/* Sidebar - Desktop */}
            <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-bg-secondary/95 backdrop-blur-xl border-r border-white/10 shadow-card">
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
                    <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center shadow-glow-indigo">
                        <span className="text-white font-bold text-lg">E</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-text-primary">College ERP</h1>
                        <p className="text-xs text-text-muted">Admin Portal</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex min-h-[46px] items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive
                                    ? 'bg-secondary/15 text-secondary shadow-card'
                                    : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                            <span className="text-secondary font-semibold">
                                {user?.fullName?.charAt(0) || 'A'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{user?.fullName}</p>
                            <p className="text-xs text-text-muted truncate">{user?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full flex min-h-[44px] items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 w-72 max-w-[86vw] bg-bg-secondary/95 backdrop-blur-xl border-r border-white/10 transform transition-transform duration-300 z-50 lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">E</span>
                        </div>
                        <span className="font-bold text-text-primary">Admin</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-secondary hover:bg-white/5">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <nav className="px-4 py-6 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex min-h-[48px] items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive
                                    ? 'bg-secondary/15 text-secondary shadow-card'
                                    : 'text-text-secondary hover:bg-white/5'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 lg:ml-64">
                {/* Top Header */}
                <header className="min-h-16 bg-bg-secondary/85 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
                    {/* Left: Mobile menu + Breadcrumbs */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-secondary hover:bg-white/5 lg:hidden"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <nav className="hidden sm:flex items-center gap-2 text-sm">
                            <span className="text-text-muted">Admin</span>
                            <ChevronRight className="w-4 h-4 text-text-muted" />
                            <span className="text-text-primary font-medium">{currentPage?.label || 'Page'}</span>
                        </nav>
                    </div>

                    {/* Right: Notifications + Profile */}
                    <div className="flex items-center gap-3">
                        <button className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
                        </button>
                        <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-white/10">
                            <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                                <span className="text-secondary font-semibold text-sm">
                                    {user?.fullName?.charAt(0) || 'A'}
                                </span>
                            </div>
                            <span className="text-sm text-text-primary">{user?.fullName}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
