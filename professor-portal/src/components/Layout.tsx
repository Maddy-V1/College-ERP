// ============================================
// Professor Portal - Layout Components
// ============================================

import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// ============================================
// Bottom Navigation
// ============================================
export function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();

    const items = [
        {
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            ),
            label: 'Home',
            path: '/home'
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
            label: 'Attendance',
            path: '/attendance'
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            label: 'Marks',
            path: '/marks'
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
            ),
            label: 'Groups',
            path: '/groups'
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            label: 'Profile',
            path: '/profile'
        },
    ];

    const isActive = (path: string) => {
        if (path === '/home') {
            return location.pathname === '/home' || location.pathname === '/dashboard' || location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 min-h-[78px] bg-bg-secondary/95 backdrop-blur-xl border-t border-white/10 grid grid-cols-5 items-center z-50 safe-area-bottom shadow-elevated">
            {items.map((item) => (
                <button
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    className={`mx-1 flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 transition-all duration-200 ${isActive(item.path)
                        ? 'bg-primary/15 text-primary shadow-glow-teal'
                        : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                        }`}
                >
                    <span className={isActive(item.path) ? 'animate-bounce-subtle' : ''}>
                        {item.icon}
                    </span>
                    <span className="text-[11px] font-semibold leading-none">{item.label}</span>
                </button>
            ))}
        </nav>
    );
}

// ============================================
// Top Header
// ============================================
interface HeaderProps {
    title?: string;
    showDate?: boolean;
    showNotification?: boolean;
    showBack?: boolean;
    onBack?: () => void;
}

export function Header({ title, showDate = false, showNotification = true, showBack = false, onBack }: HeaderProps) {
    const { user } = useAuth();
    const navigate = useNavigate();

    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });

    const getGreeting = () => {
        const hour = today.getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <header className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-xl border-b border-white/10 safe-area-top">
            <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                    {showBack && (
                        <button
                            onClick={onBack || (() => navigate(-1))}
                            className="-ml-2 flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                    <div>
                        {title ? (
                            <h1 className="text-lg font-bold text-text-primary">{title}</h1>
                        ) : (
                            <>
                                {showDate && (
                                    <p className="text-xs text-text-muted">{dateString}</p>
                                )}
                                <p className="text-sm font-medium text-text-secondary">{getGreeting()}</p>
                                <h1 className="text-xl font-bold text-text-primary">
                                    Prof. {user?.fullName?.split(' ')[0] || 'Professor'}
                                </h1>
                            </>
                        )}
                    </div>
                </div>

                {showNotification && (
                    <button
                        onClick={() => navigate('/notifications')}
                        className="relative flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {/* Notification badge */}
                        <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
                    </button>
                )}
            </div>
        </header>
    );
}

// ============================================
// Page Container
// ============================================
interface PageContainerProps {
    children: React.ReactNode;
    header?: React.ReactNode;
    noPadding?: boolean;
    noBottomNav?: boolean;
}

export function PageContainer({ children, header, noPadding = false, noBottomNav = false }: PageContainerProps) {
    return (
        <div className="min-h-screen bg-bg-primary">
            {header}
            <main className={`${noPadding ? '' : 'mx-auto w-full max-w-3xl px-4 py-4'} ${noBottomNav ? '' : 'pb-24'}`}>
                {children}
            </main>
            {!noBottomNav && <BottomNav />}
        </div>
    );
}

// ============================================
// Loading Spinner
// ============================================
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizeClass = {
        sm: 'w-5 h-5 border-2',
        md: 'w-8 h-8 border-2',
        lg: 'w-12 h-12 border-3',
    }[size];

    return (
        <div className={`${sizeClass} border-primary border-t-transparent rounded-full animate-spin`} />
    );
}

// ============================================
// Empty State
// ============================================
interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            {icon && (
                <div className="w-16 h-16 rounded-lg bg-bg-tertiary flex items-center justify-center mb-4 text-text-muted">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-semibold text-text-primary mb-1">{title}</h3>
            {description && <p className="text-sm text-text-secondary mb-4">{description}</p>}
            {action}
        </div>
    );
}

// ============================================
// Card Component
// ============================================
interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    variant?: 'default' | 'glass' | 'outlined';
}

export function Card({ children, className = '', onClick, variant = 'glass' }: CardProps) {
    const variants = {
        default: 'bg-bg-secondary',
        glass: 'glass-card',
        outlined: 'border border-white/10 bg-transparent',
    };

    return (
        <div
            className={`rounded-xl p-4 ${variants[variant]} ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}

// ============================================
// Button Component
// ============================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    fullWidth?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const variants = {
        primary: 'bg-gradient-primary text-white shadow-glow-teal hover:shadow-elevated',
        secondary: 'bg-bg-tertiary text-text-primary hover:bg-bg-elevated',
        ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5',
        danger: 'bg-error text-white hover:bg-error/90',
    };

    const sizes = {
        sm: 'px-3 py-2 text-sm min-h-[44px]',
        md: 'px-4 py-3 text-sm min-h-[50px]',
        lg: 'px-6 py-3 text-base min-h-[54px]',
    };

    return (
        <button
            className={`
                ${variants[variant]} 
                ${sizes[size]} 
                ${fullWidth ? 'w-full' : ''} 
                rounded-lg font-medium transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                ${className}
            `}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <LoadingSpinner size="sm" />}
            {children}
        </button>
    );
}

// ============================================
// Badge Component
// ============================================
interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
    const variants = {
        default: 'bg-bg-tertiary text-text-secondary',
        success: 'bg-success/20 text-success',
        warning: 'bg-warning/20 text-warning',
        danger: 'bg-error/20 text-error',
        info: 'bg-primary/20 text-primary',
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
            {children}
        </span>
    );
}
