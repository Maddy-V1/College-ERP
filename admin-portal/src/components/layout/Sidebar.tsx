import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    Building2,
    Settings,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    Layers,
    BookText,
    Bell,
} from 'lucide-react';

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Professors', path: '/professors' },
    { icon: GraduationCap, label: 'Students', path: '/students' },
    { icon: BookOpen, label: 'Courses', path: '/courses' },
    { icon: Layers, label: 'Batches', path: '/batches' },
    { icon: Building2, label: 'Classes', path: '/classes' },
    { icon: BookText, label: 'Subjects', path: '/subjects' },
    { icon: Bell, label: 'Send Notification', path: '/notifications' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    return (
        <aside
            className={`
        ${collapsed ? 'w-20' : 'w-64'}
        h-full bg-bg-secondary border-r border-white/10
        flex flex-col transition-all duration-300 ease-out
      `}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                {!collapsed && (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">E</span>
                        </div>
                        <span className="font-semibold text-lg text-text-primary">College ERP</span>
                    </div>
                )}
                {collapsed && (
                    <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
                        <span className="text-white font-bold text-lg">E</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-hide">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `sidebar-item ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`
                        }
                        title={collapsed ? item.label : undefined}
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Collapse toggle */}
            <div className="p-3 border-t border-white/10">
                <button
                    onClick={onToggle}
                    className="w-full flex items-center justify-center p-2 rounded-md hover:bg-white/5 text-text-secondary transition-colors"
                >
                    {collapsed ? (
                        <ChevronRight className="w-5 h-5" />
                    ) : (
                        <>
                            <ChevronLeft className="w-5 h-5" />
                            <span className="ml-2 text-sm">Collapse</span>
                        </>
                    )}
                </button>
            </div>
        </aside>
    );
}
