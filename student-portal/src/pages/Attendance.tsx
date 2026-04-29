// ============================================
// Student Portal - Attendance Page
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header, PageContainer, Card, Badge, LoadingSpinner, EmptyState, ProgressBar } from '../components/Layout';

// ============================================
// Types
// ============================================
interface SubjectAttendance {
    class_subject_id: string;
    subject_id: string;
    subject_name: string;
    subject_code: string;
    professor_name: string;
    total_classes: number;
    attended: number;
    percentage: number;
    status: 'good' | 'warning' | 'danger';
}

interface AttendanceSession {
    session_id: string;
    date: string;
    time?: string;
    session_type?: string;
    status: string;
}

interface AttendanceData {
    overall: {
        total_classes: number;
        attended: number;
        percentage: number;
        status: 'good' | 'warning' | 'danger';
    };
    subjects: SubjectAttendance[];
}

interface SubjectDetail {
    subject_name: string;
    subject_code: string;
    professor_name: string;
    total_classes: number;
    history: AttendanceSession[];
}

// ============================================
// API Configuration
// ============================================
const API_BASE = import.meta.env.VITE_ACADEMIC_API_URL || 'http://localhost:4002/api/academic/v1';

// ============================================
// Donut Chart Component
// ============================================
function DonutChart({ percentage, status }: { percentage: number; status: 'good' | 'warning' | 'danger' }) {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const colors = {
        good: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
    };

    return (
        <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="10"
                />
                {/* Progress circle */}
                <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    stroke={colors[status]}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${status === 'good' ? 'text-success' : status === 'warning' ? 'text-warning' : 'text-error'}`}>
                    {percentage}%
                </span>
                <span className="text-xs text-text-muted">Overall</span>
            </div>
        </div>
    );
}

// ============================================
// Subject Attendance Card
// ============================================
interface SubjectCardProps {
    subject: SubjectAttendance;
    onExpand: () => void;
}

function SubjectCard({ subject, onExpand }: SubjectCardProps) {
    const statusColors = {
        good: 'success' as const,
        warning: 'warning' as const,
        danger: 'error' as const,
    };

    return (
        <Card
            className="cursor-pointer hover:border-accent-teal/50 transition-all"
            onClick={onExpand}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    {/* Subject Name */}
                    <h3 className="font-semibold text-text-primary truncate mb-1">
                        {subject.subject_name}
                    </h3>

                    {/* Subject Code & Professor */}
                    <p className="text-xs text-text-muted mb-2">
                        {subject.subject_code} • {subject.professor_name || 'TBA'}
                    </p>

                    {/* Progress Bar */}
                    <ProgressBar
                        value={subject.attended}
                        max={subject.total_classes}
                        variant={statusColors[subject.status]}
                        height="md"
                    />

                    {/* Stats */}
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-text-secondary">
                            {subject.attended}/{subject.total_classes} classes
                        </span>
                        <Badge variant={statusColors[subject.status]}>
                            {subject.percentage}%
                        </Badge>
                    </div>
                </div>

                {/* Expand Icon */}
                <svg className="w-5 h-5 text-text-muted flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </div>
        </Card>
    );
}

// ============================================
// Attendance History Modal
// ============================================
interface HistoryModalProps {
    subject: SubjectAttendance;
    detail: SubjectDetail | null;
    loading: boolean;
    onClose: () => void;
}

function HistoryModal({ subject, detail, loading, onClose }: HistoryModalProps) {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-bg-secondary rounded-t-2xl sm:rounded-2xl w-full max-w-md mx-0 sm:mx-4 p-6 max-h-[80vh] overflow-hidden animate-slide-up">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary">{subject.subject_name}</h3>
                        <p className="text-sm text-text-secondary">{subject.subject_code}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-text-muted hover:text-text-primary"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Summary */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${subject.status === 'good' ? 'border-success text-success' :
                            subject.status === 'warning' ? 'border-warning text-warning' :
                                'border-error text-error'
                            }`}>
                            <span className="text-sm font-bold">{subject.percentage}%</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-primary">
                                {subject.attended} / {subject.total_classes}
                            </p>
                            <p className="text-xs text-text-muted">Classes Attended</p>
                        </div>
                    </div>
                    <Badge variant={subject.status === 'good' ? 'success' : subject.status === 'warning' ? 'warning' : 'error'}>
                        {subject.status === 'good' ? 'Good' : subject.status === 'warning' ? 'At Risk' : 'Critical'}
                    </Badge>
                </div>

                {/* Attendance Timeline */}
                <h4 className="text-sm font-semibold text-text-secondary mb-3">Attendance History</h4>

                <div className="overflow-y-auto max-h-[40vh] -mx-2 px-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <LoadingSpinner />
                        </div>
                    ) : detail?.history && detail.history.length > 0 ? (
                        <div className="space-y-2">
                            {detail.history.map((session, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${session.status === 'present' || session.status === 'late'
                                            ? 'bg-success/20 text-success'
                                            : 'bg-error/20 text-error'
                                            }`}>
                                            {session.status === 'present' || session.status === 'late' ? (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-text-primary">
                                                {formatDate(session.date)}
                                            </p>
                                            {session.session_type && (
                                                <p className="text-xs text-text-muted capitalize">
                                                    {session.session_type}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Badge variant={session.status === 'present' || session.status === 'late' ? 'success' : 'error'}>
                                        {session.status === 'present' ? 'P' : session.status === 'late' ? 'L' : 'A'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            }
                            title="No history yet"
                            description="Attendance records will appear here once classes are conducted."
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================
// Main Attendance Component
// ============================================
export default function Attendance() {
    const { user } = useAuth();

    const [data, setData] = useState<AttendanceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<SubjectAttendance | null>(null);
    const [subjectDetail, setSubjectDetail] = useState<SubjectDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchAttendance();
    }, [user]);

    const fetchAttendance = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/attendance/my?user_id=${user.id}`);
            const result = await response.json();

            if (result.success) {
                setData(result.data);
            } else {
                setError(result.message || 'Failed to fetch attendance');
            }
        } catch (err) {
            console.error('Error fetching attendance:', err);
            setError('Failed to load attendance data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjectDetail = async (subject: SubjectAttendance) => {
        if (!user) return;

        setSelectedSubject(subject);
        setDetailLoading(true);

        try {
            const response = await fetch(
                `${API_BASE}/attendance/my/${subject.class_subject_id}?user_id=${user.id}`
            );
            const result = await response.json();

            if (result.success) {
                setSubjectDetail(result.data);
            }
        } catch (err) {
            console.error('Error fetching subject detail:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedSubject(null);
        setSubjectDetail(null);
    };

    return (
        <PageContainer
            header={<Header title="Attendance" />}
        >
            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <EmptyState
                    icon={
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    }
                    title="Unable to load attendance"
                    description={error}
                    action={
                        <button onClick={fetchAttendance} className="btn-secondary">
                            Try Again
                        </button>
                    }
                />
            )}

            {/* Content */}
            {!loading && !error && data && (
                <>
                    {/* Overall Attendance Card */}
                    <Card className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-text-primary mb-2">Overall Attendance</h2>
                                <div className="space-y-1">
                                    <p className="text-sm text-text-secondary">
                                        <span className="font-medium text-text-primary">{data.overall.attended}</span>
                                        {' '}/ {data.overall.total_classes} classes attended
                                    </p>
                                    <p className="text-xs text-text-muted">
                                        Minimum required: 75%
                                    </p>
                                </div>
                            </div>
                            <DonutChart
                                percentage={data.overall.percentage}
                                status={data.overall.status}
                            />
                        </div>
                    </Card>

                    {/* Subject-wise Attendance */}
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-text-primary mb-3">Subject-wise Attendance</h2>
                    </div>

                    {data.subjects.length === 0 ? (
                        <EmptyState
                            icon={
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            }
                            title="No subjects found"
                            description="Subjects will appear here once you're enrolled in classes."
                        />
                    ) : (
                        <div className="space-y-3">
                            {data.subjects.map((subject) => (
                                <SubjectCard
                                    key={subject.class_subject_id}
                                    subject={subject}
                                    onExpand={() => fetchSubjectDetail(subject)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* History Modal */}
            {selectedSubject && (
                <HistoryModal
                    subject={selectedSubject}
                    detail={subjectDetail}
                    loading={detailLoading}
                    onClose={closeModal}
                />
            )}

        </PageContainer>
    );
}
