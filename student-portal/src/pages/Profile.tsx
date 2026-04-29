// ============================================
// Student Portal - Profile Page
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header, PageContainer, Card, LoadingSpinner, EmptyState, Badge } from '../components/Layout';

// ============================================
// Types - Matching actual database schema
// ============================================
interface StudentProfile {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    role: string;
    roll_number: string;
    enrollment_number: string;
    class_label: string;
    department: string;
    department_code: string;
    academic_year: string;
    batch_year: number;
    semester: number;
    enrolled_on: string;
    gender: string;
    date_of_birth: string;
    blood_group: string;
    category: string;
    is_hosteller: boolean;
    admission_year: number;
    address: string;
    // Guardian info
    guardian_name: string;
    guardian_phone: string;
    guardian_email: string;
    guardian_relationship: string;
}

// ============================================
// API Configuration
// ============================================
const API_BASE = import.meta.env.VITE_ACADEMIC_API_URL || 'http://localhost:4002/api/academic/v1';

export default function Profile() {
    const { user, signOut } = useAuth();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE}/student/profile?user_id=${user.id}`);
            const data = await response.json();

            if (data.success) {
                setProfile(data.data);
            } else {
                setError(data.message || 'Failed to fetch profile');
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (err) {
            console.error('Unexpected error signing out:', err);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <PageContainer
            header={<Header title="My Profile" />}
        >
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : error ? (
                <EmptyState
                    icon={
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    }
                    title="Profile Error"
                    description={error}
                    action={
                        <button onClick={fetchProfile} className="btn-secondary">
                            Try Again
                        </button>
                    }
                />
            ) : profile ? (
                <div className="space-y-6 pb-24">
                    {/* Basic Info Card */}
                    <Card className="flex flex-col items-center pt-8 pb-8">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent-teal to-primary flex items-center justify-center mb-4 shadow-lg">
                            <span className="text-3xl font-bold text-white">
                                {profile.full_name?.charAt(0) || 'S'}
                            </span>
                        </div>
                        <h2 className="text-xl font-bold text-text-primary text-center">{profile.full_name}</h2>
                        <p className="text-text-secondary text-sm">{profile.email}</p>
                        <div className="mt-4 flex gap-2 flex-wrap justify-center">
                            <Badge variant="success">
                                {profile.roll_number || 'No Roll'}
                            </Badge>
                            {profile.blood_group && (
                                <Badge variant="error">
                                    {profile.blood_group}
                                </Badge>
                            )}
                            {profile.gender && (
                                <Badge variant="info">
                                    {profile.gender}
                                </Badge>
                            )}
                        </div>
                    </Card>

                    {/* Academic Info */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-text-muted uppercase ml-1">
                            Academic Details
                        </h3>
                        <Card>
                            <div className="space-y-4">
                                <ProfileRow label="Class" value={profile.class_label || 'Not Assigned'} />
                                <ProfileRow label="Enrollment No." value={profile.enrollment_number || '-'} />
                                <ProfileRow label="Branch" value={profile.department || '-'} />
                                {profile.semester && <ProfileRow label="Semester" value={`Semester ${profile.semester}`} />}
                                <ProfileRow label="Batch" value={profile.academic_year || (profile.batch_year ? `${profile.batch_year}` : '-')} />
                                <ProfileRow label="Admission Year" value={profile.admission_year?.toString() || '-'} />
                                <ProfileRow label="Enrolled On" value={formatDate(profile.enrolled_on)} isLast />
                            </div>
                        </Card>
                    </div>

                    {/* Personal Info */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-text-muted uppercase ml-1">
                            Personal Details
                        </h3>
                        <Card>
                            <div className="space-y-4">
                                <ProfileRow label="Phone" value={profile.phone || '-'} />
                                <ProfileRow label="Date of Birth" value={formatDate(profile.date_of_birth)} />
                                <ProfileRow label="Category" value={profile.category || '-'} />
                                <ProfileRow label="Hosteller" value={profile.is_hosteller ? 'Yes' : 'No'} />
                                {profile.address && <ProfileRow label="Address" value={profile.address} isLast />}
                            </div>
                        </Card>
                    </div>

                    {/* Guardian Info */}
                    {(profile.guardian_name || profile.guardian_phone) && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-muted uppercase ml-1">
                                Guardian Details
                            </h3>
                            <Card>
                                <div className="space-y-4">
                                    <ProfileRow label="Name" value={profile.guardian_name || '-'} />
                                    {profile.guardian_relationship && (
                                        <ProfileRow label="Relationship" value={profile.guardian_relationship} />
                                    )}
                                    <ProfileRow label="Phone" value={profile.guardian_phone || '-'} />
                                    <ProfileRow label="Email" value={profile.guardian_email || '-'} isLast />
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Actions */}
                    <button
                        onClick={handleSignOut}
                        className="w-full py-3.5 rounded-xl border border-error/50 text-error hover:bg-error/10 font-medium transition-colors"
                    >
                        Sign Out
                    </button>

                    <div className="text-center text-xs text-text-muted pt-4">
                        College ERP Student Portal v1.0.0
                    </div>
                </div>
            ) : null}

        </PageContainer>
    );
}

// Helper component for profile rows
function ProfileRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
    return (
        <div className={`flex justify-between items-start ${isLast ? '' : 'pb-3 border-b border-white/5'}`}>
            <span className="text-text-secondary text-sm flex-shrink-0">{label}</span>
            <span className="text-text-primary font-medium text-right max-w-[65%] break-words">{value}</span>
        </div>
    );
}
