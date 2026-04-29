// ============================================
// Student Portal - Marks Page
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header, PageContainer, Card, Badge, LoadingSpinner, EmptyState } from '../components/Layout';

// ============================================
// Types
// ============================================
interface AssessmentComponent {
    id: string;
    name: string;
    max_marks: number;
    obtained: number | null;
    percentage: number | null;
}

interface SubjectMarks {
    class_subject_id: string;
    subject_id: string;
    subject_name: string;
    subject_code: string;
    professor_name: string;
    components: AssessmentComponent[];
    total_max: number;
    total_obtained: number;
    percentage: number | null;
}

interface SubjectDetail {
    subject_name: string;
    subject_code: string;
    professor_name: string;
    components: {
        id: string;
        name: string;
        type: string;
        max_marks: number;
        weightage: number;
        obtained: number | null;
        percentage: number | null;
        updated_at: string | null;
    }[];
}

// ============================================
// API Configuration
// ============================================
const API_BASE = import.meta.env.VITE_ACADEMIC_API_URL || 'http://localhost:4002/api/academic/v1';

// ============================================
// Bar Chart Component
// ============================================
function BarChart({ subjects }: { subjects: SubjectMarks[] }) {
    const maxHeight = 120;

    return (
        <div className="flex items-end justify-around gap-2 h-36 px-4">
            {subjects.map((subject) => {
                const height = (subject.percentage || 0) / 100 * maxHeight;
                const color = (subject.percentage || 0) >= 75
                    ? 'bg-success'
                    : (subject.percentage || 0) >= 50
                        ? 'bg-warning'
                        : 'bg-error';

                return (
                    <div key={subject.class_subject_id} className="flex flex-col items-center gap-1">
                        <span className="text-xs font-medium text-text-primary">
                            {subject.percentage !== null ? `${subject.percentage}%` : '-'}
                        </span>
                        <div
                            className={`w-8 rounded-t-md transition-all duration-500 ${color}`}
                            style={{ height: Math.max(height, 4) }}
                        />
                        <span className="text-xs text-text-muted text-center max-w-12 truncate">
                            {subject.subject_code || subject.subject_name.substring(0, 4)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ============================================
// Subject Marks Card
// ============================================
interface SubjectCardProps {
    subject: SubjectMarks;
    onExpand: () => void;
}

function SubjectCard({ subject, onExpand }: SubjectCardProps) {
    const getGrade = (percentage: number | null): string => {
        if (percentage === null) return '-';
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C';
        if (percentage >= 40) return 'D';
        return 'F';
    };

    const gradeColors: { [key: string]: string } = {
        'A+': 'text-success',
        'A': 'text-success',
        'B+': 'text-accent-teal',
        'B': 'text-accent-teal',
        'C': 'text-warning',
        'D': 'text-warning',
        'F': 'text-error',
        '-': 'text-text-muted',
    };

    const grade = getGrade(subject.percentage);

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
                    <p className="text-xs text-text-muted mb-3">
                        {subject.subject_code} • {subject.professor_name || 'TBA'}
                    </p>

                    {/* Components */}
                    {subject.components.length > 0 ? (
                        <div className="space-y-2">
                            {subject.components.slice(0, 3).map((comp) => (
                                <div key={comp.id} className="flex items-center justify-between text-sm">
                                    <span className="text-text-secondary truncate max-w-32">
                                        {comp.name}
                                    </span>
                                    <span className={`font-medium ${comp.obtained !== null ? 'text-text-primary' : 'text-text-muted'}`}>
                                        {comp.obtained !== null ? `${comp.obtained}/${comp.max_marks}` : '-'}
                                    </span>
                                </div>
                            ))}
                            {subject.components.length > 3 && (
                                <p className="text-xs text-text-muted">
                                    +{subject.components.length - 3} more
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-text-muted italic">No assessments yet</p>
                    )}
                </div>

                {/* Grade & Percentage */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-bg-tertiary flex items-center justify-center">
                        <span className={`text-xl font-bold ${gradeColors[grade]}`}>
                            {grade}
                        </span>
                    </div>
                    {subject.percentage !== null && (
                        <span className="text-xs text-text-muted">{subject.percentage}%</span>
                    )}
                </div>
            </div>
        </Card>
    );
}

// ============================================
// Marks Detail Modal
// ============================================
interface DetailModalProps {
    subject: SubjectMarks;
    detail: SubjectDetail | null;
    loading: boolean;
    onClose: () => void;
}

function DetailModal({ subject, detail, loading, onClose }: DetailModalProps) {
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
        });
    };

    const getGrade = (percentage: number | null): string => {
        if (percentage === null) return '-';
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B+';
        if (percentage >= 60) return 'B';
        if (percentage >= 50) return 'C';
        if (percentage >= 40) return 'D';
        return 'F';
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
                        <div className="w-12 h-12 rounded-full bg-accent-teal/20 flex items-center justify-center">
                            <span className="text-lg font-bold text-accent-teal">
                                {getGrade(subject.percentage)}
                            </span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-text-primary">
                                {subject.total_obtained} / {subject.total_max}
                            </p>
                            <p className="text-xs text-text-muted">Total Marks</p>
                        </div>
                    </div>
                    {subject.percentage !== null && (
                        <Badge variant={subject.percentage >= 75 ? 'success' : subject.percentage >= 50 ? 'warning' : 'error'}>
                            {subject.percentage}%
                        </Badge>
                    )}
                </div>

                {/* Components List */}
                <h4 className="text-sm font-semibold text-text-secondary mb-3">Assessment Components</h4>

                <div className="overflow-y-auto max-h-[40vh] -mx-2 px-2">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <LoadingSpinner />
                        </div>
                    ) : detail?.components && detail.components.length > 0 ? (
                        <div className="space-y-2">
                            {detail.components.map((comp) => (
                                <div
                                    key={comp.id}
                                    className="p-3 rounded-lg bg-bg-tertiary/50"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-medium text-text-primary text-sm truncate">
                                                {comp.name}
                                            </h5>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant="default">{comp.type}</Badge>
                                                {comp.updated_at && (
                                                    <span className="text-xs text-text-muted">
                                                        {formatDate(comp.updated_at)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${comp.obtained !== null ? 'text-text-primary' : 'text-text-muted'}`}>
                                                {comp.obtained !== null ? comp.obtained : '-'} / {comp.max_marks}
                                            </p>
                                            {comp.percentage !== null && (
                                                <p className={`text-xs ${comp.percentage >= 75 ? 'text-success' :
                                                        comp.percentage >= 50 ? 'text-warning' :
                                                            'text-error'
                                                    }`}>
                                                    {comp.percentage}%
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${comp.percentage === null ? 'bg-text-muted' :
                                                    comp.percentage >= 75 ? 'bg-success' :
                                                        comp.percentage >= 50 ? 'bg-warning' :
                                                            'bg-error'
                                                }`}
                                            style={{ width: `${comp.percentage ?? 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            }
                            title="No assessments yet"
                            description="Marks will appear here once assessments are conducted."
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================
// Main Marks Component
// ============================================
export default function Marks() {
    const { user } = useAuth();

    const [subjects, setSubjects] = useState<SubjectMarks[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<SubjectMarks | null>(null);
    const [subjectDetail, setSubjectDetail] = useState<SubjectDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        fetchMarks();
    }, [user]);

    const fetchMarks = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/marks/my?user_id=${user.id}`);
            const result = await response.json();

            if (result.success) {
                setSubjects(result.data);
            } else {
                setError(result.message || 'Failed to fetch marks');
            }
        } catch (err) {
            console.error('Error fetching marks:', err);
            setError('Failed to load marks data.');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjectDetail = async (subject: SubjectMarks) => {
        if (!user) return;

        setSelectedSubject(subject);
        setDetailLoading(true);

        try {
            const response = await fetch(
                `${API_BASE}/marks/my/${subject.class_subject_id}?user_id=${user.id}`
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

    // Calculate overall performance
    const overallPerformance = subjects.length > 0
        ? Math.round(
            subjects.reduce((sum, s) => sum + (s.percentage || 0), 0) /
            subjects.filter(s => s.percentage !== null).length || 0
        )
        : 0;

    return (
        <PageContainer
            header={<Header title="Marks" />}
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
                    title="Unable to load marks"
                    description={error}
                    action={
                        <button onClick={fetchMarks} className="btn-secondary">
                            Try Again
                        </button>
                    }
                />
            )}

            {/* Content */}
            {!loading && !error && (
                <>
                    {/* Overall Performance Card */}
                    <Card className="mb-6">
                        <h2 className="text-lg font-bold text-text-primary mb-4">Overall Performance</h2>

                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-3xl font-bold text-accent-teal">
                                    {overallPerformance}%
                                </p>
                                <p className="text-sm text-text-muted">Average across all subjects</p>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-accent-teal/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-accent-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        {subjects.length > 0 && subjects.length <= 8 && (
                            <div className="border-t border-white/10 pt-4">
                                <p className="text-xs text-text-muted mb-2">Subject-wise Comparison</p>
                                <BarChart subjects={subjects} />
                            </div>
                        )}
                    </Card>

                    {/* Subject-wise Marks */}
                    <div className="mb-4">
                        <h2 className="text-lg font-bold text-text-primary mb-3">Subject-wise Marks</h2>
                    </div>

                    {subjects.length === 0 ? (
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
                            {subjects.map((subject) => (
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

            {/* Detail Modal */}
            {selectedSubject && (
                <DetailModal
                    subject={selectedSubject}
                    detail={subjectDetail}
                    loading={detailLoading}
                    onClose={closeModal}
                />
            )}

        </PageContainer>
    );
}
