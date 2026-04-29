// ============================================
// Student Portal - Layout Components
// ============================================

import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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
            path: '/dashboard'
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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

    return (
        <nav className="fixed bottom-0 left-0 right-0 min-h-[74px] bg-bg-secondary/95 backdrop-blur-xl border-t border-white/10 grid grid-cols-5 items-center z-50 safe-area-bottom shadow-elevated">
            {items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                    <button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        className={`mx-1 flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 transition-all ${isActive ? 'bg-accent-teal/15 text-accent-teal shadow-glow-teal' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                            }`}
                    >
                        <span className={isActive ? 'text-accent-teal' : ''}>{item.icon}</span>
                        <span className="text-[11px] font-semibold leading-none">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}

// ============================================
// Header Component
// ============================================
interface HeaderProps {
    title?: string;
    showDate?: boolean;
    showNotification?: boolean;
    showBack?: boolean;
    onBack?: () => void;
}

export function Header({ title, showDate, showNotification, showBack, onBack }: HeaderProps) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    const formatDate = () => {
        const now = new Date();
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'short'
        };
        return now.toLocaleDateString('en-US', options);
    };

    return (
        <header className="sticky top-0 z-40 -mx-4 mb-2 flex items-center justify-between border-b border-white/10 bg-bg-primary/90 px-4 py-3 backdrop-blur-xl safe-area-top">
            <div className="flex items-center gap-3">
                {showBack && (
                    <button
                        onClick={handleBack}
                        className="-ml-2 flex min-h-[46px] min-w-[46px] items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}
                <div>
                    {title && <h1 className="text-xl font-bold text-text-primary">{title}</h1>}
                    {showDate && (
                        <p className="text-sm text-text-secondary">{formatDate()}</p>
                    )}
                </div>
            </div>

            {showNotification && (
                <button
                    onClick={() => navigate('/notifications')}
                    className="relative flex min-h-[46px] min-w-[46px] items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-accent-teal rounded-full" />
                </button>
            )}
        </header>
    );
}

// ============================================
// Page Container
// ============================================
interface PageContainerProps {
    children: ReactNode;
    header?: ReactNode;
    noPadding?: boolean;
    noBottomNav?: boolean;
}

export function PageContainer({ children, header, noPadding, noBottomNav }: PageContainerProps) {
    return (
        <div className={`min-h-screen bg-bg-primary ${noPadding ? '' : 'px-4'} ${noBottomNav ? '' : 'pb-24'}`}>
            {header}
            <main className={noPadding ? '' : 'mx-auto w-full max-w-3xl'}>
                {children}
            </main>
            {!noBottomNav && <BottomNav />}
        </div>
    );
}

// ============================================
// Card Component
// ============================================
interface CardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
    return (
        <div
            onClick={onClick}
            className={`glass-card p-4 ${onClick ? 'cursor-pointer' : ''} ${className}`}
        >
            {children}
        </div>
    );
}

// ============================================
// Badge Component
// ============================================
interface BadgeProps {
    children: ReactNode;
    variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
    const variants = {
        success: 'bg-success/20 text-success',
        warning: 'bg-warning/20 text-warning',
        error: 'bg-error/20 text-error',
        info: 'bg-info/20 text-info',
        default: 'bg-white/10 text-text-secondary',
    };

    return (
        <span className={`badge ${variants[variant]}`}>
            {children}
        </span>
    );
}

// ============================================
// Loading Spinner
// ============================================
interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className={`animate-spin ${sizes[size]} border-2 border-accent-teal border-t-transparent rounded-full`} />
    );
}

// ============================================
// Empty State
// ============================================
interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
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
            {description && (
                <p className="text-sm text-text-secondary max-w-xs">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

// ============================================
// Button Component
// ============================================
interface ButtonProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'ghost';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

export function Button({ children, variant = 'primary', onClick, disabled, className = '' }: ButtonProps) {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
}

// ============================================
// Progress Bar
// ============================================
interface ProgressBarProps {
    value: number;
    max?: number;
    variant?: 'success' | 'warning' | 'error' | 'default';
    showPercentage?: boolean;
    height?: 'sm' | 'md' | 'lg';
}

export function ProgressBar({ value, max = 100, variant = 'default', showPercentage, height = 'md' }: ProgressBarProps) {
    const percentage = Math.min(Math.round((value / max) * 100), 100);

    const variants = {
        success: 'bg-success',
        warning: 'bg-warning',
        error: 'bg-error',
        default: 'bg-accent-teal',
    };

    const heights = {
        sm: 'h-1.5',
        md: 'h-2',
        lg: 'h-3',
    };

    return (
        <div className="w-full">
            <div className={`w-full bg-white/10 rounded-full overflow-hidden ${heights[height]}`}>
                <div
                    className={`${variants[variant]} ${heights[height]} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showPercentage && (
                <p className={`text-xs mt-1 ${variants[variant].replace('bg-', 'text-')}`}>
                    {percentage}%
                </p>
            )}
        </div>
    );
}
