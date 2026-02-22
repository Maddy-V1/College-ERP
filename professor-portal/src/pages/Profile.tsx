// ============================================
// Professor Portal - Profile Page
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header, PageContainer, Card, Button, LoadingSpinner } from '../components/Layout';

// ============================================
// Types
// ============================================
interface ProfessorProfile {
    id: string;
    employee_id: string;
    department_name: string;
    designation: string;
    qualification: string;
    specialization: string;
    joining_date: string;
    employment_type: string;
}

interface TeachingStats {
    total_classes: number;
    total_students: number;
    subjects_count: number;
    attendance_sessions: number;
}

// ============================================
// API Configuration
// ============================================
const API_BASE = import.meta.env.VITE_ACADEMIC_API_URL || 'http://localhost:4002/api/academic/v1';

// ============================================
// Profile Header Component
// ============================================
function ProfileHeader({ user, profile }: { user: any; profile: ProfessorProfile | null }) {
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="text-center py-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
                <span className="text-3xl font-bold text-white">
                    {getInitials(user?.fullName || 'P')}
                </span>
            </div>

            {/* Name & Role */}
            <h1 className="text-xl font-bold text-text-primary">{user?.fullName}</h1>
            <p className="text-text-secondary">{profile?.designation || 'Professor'}</p>

            {/* Employee ID */}
            {profile?.employee_id && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary mt-2">
                    ID: {profile.employee_id}
                </span>
            )}
        </div>
    );
}

// ============================================
// Info Card Component
// ============================================
function InfoCard({ title, items }: { title: string; items: { label: string; value: string | null | undefined }[] }) {
    return (
        <Card className="mb-4">
            <h3 className="text-sm font-medium text-text-secondary mb-3">{title}</h3>
            <div className="space-y-3">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-text-muted">{item.label}</span>
                        <span className="text-sm font-medium text-text-primary">{item.value || '-'}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ============================================
// Stats Card Component
// ============================================
function StatsCard({ stats }: { stats: TeachingStats }) {
    const statItems = [
        { label: 'Classes', value: stats.total_classes, icon: '📚' },
        { label: 'Students', value: stats.total_students, icon: '👥' },
        { label: 'Subjects', value: stats.subjects_count, icon: '📖' },
        { label: 'Sessions', value: stats.attendance_sessions, icon: '✓' },
    ];

    return (
        <Card className="mb-4">
            <h3 className="text-sm font-medium text-text-secondary mb-3">Teaching Overview</h3>
            <div className="grid grid-cols-2 gap-3">
                {statItems.map((stat, i) => (
                    <div key={i} className="text-center p-3 rounded-lg bg-bg-tertiary">
                        <span className="text-2xl">{stat.icon}</span>
                        <p className="text-xl font-bold text-text-primary mt-1">{stat.value}</p>
                        <p className="text-xs text-text-secondary">{stat.label}</p>
                    </div>
                ))}
            </div>
        </Card>
    );
}

// ============================================
// Menu Item Component
// ============================================
function MenuItem({
    icon,
    label,
    onClick,
    danger = false
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-4 rounded-lg transition-colors ${danger
                ? 'text-error hover:bg-error/10'
                : 'text-text-primary hover:bg-white/5'
                }`}
        >
            <span className={danger ? 'text-error' : 'text-text-secondary'}>{icon}</span>
            <span className="flex-1 text-left font-medium">{label}</span>
            <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </button>
    );
}

// ============================================
// Main Profile Component
// ============================================
export default function Profile() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<ProfessorProfile | null>(null);
    const [stats, setStats] = useState<TeachingStats>({
        total_classes: 0,
        total_students: 0,
        subjects_count: 0,
        attendance_sessions: 0,
    });
    const [loading, setLoading] = useState(true);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Fetch professor profile from API
            const profileResponse = await fetch(`${API_BASE}/professor/profile?user_id=${user.id}`);
            const profileData = await profileResponse.json();

            if (profileData.success) {
                setProfile({
                    id: profileData.data.id,
                    employee_id: profileData.data.employee_id,
                    department_name: profileData.data.department_name,
                    designation: profileData.data.designation,
                    qualification: profileData.data.qualification,
                    specialization: profileData.data.specialization,
                    joining_date: profileData.data.joining_date,
                    employment_type: profileData.data.employment_type,
                });
            }

            // Fetch assigned classes to calculate stats
            const response = await fetch(`${API_BASE}/timetable/assigned-classes?user_id=${user.id}`);
            const data = await response.json();

            // API returns array directly
            const classes = Array.isArray(data) ? data : [];
            setStats({
                total_classes: classes.length,
                total_students: classes.reduce((sum: number, c: any) => sum + (c.student_count || 0), 0),
                subjects_count: new Set(classes.map((c: any) => c.subject_id)).size,
                attendance_sessions: 0, // Would need separate API
            });
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <PageContainer header={<Header title="Profile" />}>
                <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer header={<Header title="Profile" showNotification={false} />}>
            {/* Profile Header */}
            <ProfileHeader user={user} profile={profile} />

            {/* Stats */}
            <StatsCard stats={stats} />

            {/* Personal Info */}
            <InfoCard
                title="Personal Information"
                items={[
                    { label: 'Email', value: user?.email ?? null },
                    { label: 'Department', value: profile?.department_name ?? null },
                    { label: 'Qualification', value: profile?.qualification ?? null },
                    { label: 'Specialization', value: profile?.specialization ?? null },
                ]}
            />

            {/* Employment Info */}
            <InfoCard
                title="Employment Details"
                items={[
                    { label: 'Employee ID', value: profile?.employee_id ?? null },
                    { label: 'Designation', value: profile?.designation ?? null },
                    { label: 'Type', value: profile?.employment_type ?? null },
                    { label: 'Joined', value: profile?.joining_date ? new Date(profile.joining_date).toLocaleDateString() : null },
                ]}
            />

            {/* Menu */}
            <Card>
                <MenuItem
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    }
                    label="Notifications"
                    onClick={() => navigate('/notifications')}
                />
                <MenuItem
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    label="Help & Support"
                    onClick={() => { }}
                />
                <MenuItem
                    icon={
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    }
                    label="Sign Out"
                    onClick={() => setShowLogoutConfirm(true)}
                    danger
                />
            </Card>

            {/* App Version */}
            <p className="text-center text-xs text-text-muted mt-6 mb-4">
                Professor Portal v1.0.0
            </p>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
                    <div className="relative bg-bg-secondary rounded-2xl w-full max-w-xs mx-4 p-6 text-center animate-scale-up">
                        <div className="w-16 h-16 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-text-primary mb-2">Sign Out?</h3>
                        <p className="text-sm text-text-secondary mb-6">Are you sure you want to sign out?</p>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => setShowLogoutConfirm(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handleLogout} className="flex-1">
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </PageContainer>
    );
}
