// ============================================
// Professor Portal - Attendance Page
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header, PageContainer, Card, LoadingSpinner, EmptyState, Button } from '../components/Layout';

// ============================================
// Types
// ============================================
interface AssignedClass {
    class_subject_id: string;
    class_id: string;
    class_label: string;
    subject_id: string;
    subject_name: string;
    subject_code: string;
    batch_name: string;
    batch_year: number;
    branch_name: string;
    branch_code: string;
    student_count: number;
}

interface Student {
    id: string;
    student_id: string;
    roll_number: string;
    full_name: string;
    email: string;
}

interface AttendanceRecord {
    student_id: string;
    status: 'present' | 'absent' | 'late' | 'leave';
    roll_number?: string;
    full_name?: string;
}

// ============================================
// API Configuration
// ============================================
const API_BASE = import.meta.env.VITE_ACADEMIC_API_URL || 'http://localhost:4002/api/academic/v1';

// ============================================
// Types for Stats
// ============================================
interface AttendanceSession {
    id: string;
    conducted_date: string;
    conducted_time: string;
    total_present: number;
    total_absent: number;
    is_finalized: boolean;
}

interface StudentStat {
    student_id: string;
    roll_number: string;
    full_name: string;
    classes_attended: number;
    classes_absent: number;
    total_classes: number;
    percentage: number;
    status: 'good' | 'warning' | 'danger';
}

interface AttendanceStatsData {
    class_subject_id: string;
    subject_name: string;
    subject_code: string;
    class_label: string;
    stats: {
        total_sessions: number;
        total_students: number;
        average_percentage: number;
        sessions_today: number;
    };
    sessions: AttendanceSession[];
    students: StudentStat[];
}

// ============================================
// Class Selection Component
// ============================================
function ClassSelection({
    onSelect,
    onViewStats
}: {
    onSelect: (cls: AssignedClass) => void;
    onViewStats: (cls: AssignedClass) => void;
}) {
    const { user } = useAuth();
    const [classes, setClasses] = useState<AssignedClass[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssignedClasses();
    }, [user]);

    const fetchAssignedClasses = async () => {
        if (!user) return;

        try {
            const response = await fetch(
                `${API_BASE}/timetable/assigned-classes?user_id=${user.id}`
            );
            const data = await response.json();
            // API returns array directly, not wrapped in success object
            setClasses(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching assigned classes:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (classes.length === 0) {
        return (
            <EmptyState
                icon={
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                }
                title="No assigned classes"
                description="You don't have any classes assigned yet."
            />
        );
    }

    return (
        <div className="space-y-3">
            <h2 className="text-lg font-bold text-text-primary mb-4">Select Class</h2>
            {classes.map((cls) => (
                <Card
                    key={cls.class_subject_id}
                    onClick={() => onSelect(cls)}
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-text-primary">{cls.subject_name}</h3>
                            <p className="text-sm text-text-secondary">{cls.subject_code}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                                <span>{cls.class_label}</span>
                                <span>•</span>
                                <span>{cls.student_count} students</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewStats(cls);
                                }}
                                className="p-2 rounded-lg bg-bg-tertiary hover:bg-primary/20 text-text-muted hover:text-primary transition-colors"
                                title="View History & Stats"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </button>
                            <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

// ============================================
// Attendance Marking Component (10-student pagination)
// ============================================
interface AttendanceMarkingProps {
    classSubject: AssignedClass;
    date: string;
    onComplete: (records: AttendanceRecord[]) => void;
    onBack: () => void;
}

function AttendanceMarking({ classSubject, date, onComplete, onBack }: AttendanceMarkingProps) {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const [attendance, setAttendance] = useState<Map<string, 'present' | 'absent' | 'late'>>(new Map());
    const STUDENTS_PER_PAGE = 10;

    useEffect(() => {
        fetchStudents(currentPage);
    }, [currentPage]);

    const fetchStudents = async (page: number) => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE}/attendance/students?class_subject_id=${classSubject.class_subject_id}&page=${page}&limit=${STUDENTS_PER_PAGE}`
            );
            const data = await response.json();

            if (data.success) {
                setStudents(data.data);
                setTotalPages(data.pagination.totalPages);
                setTotalStudents(data.pagination.total);

                // Initialize attendance for new students (default: present)
                const newAttendance = new Map(attendance);
                data.data.forEach((s: Student) => {
                    if (!newAttendance.has(s.student_id)) {
                        newAttendance.set(s.student_id, 'present');
                    }
                });
                setAttendance(newAttendance);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoading(false);
        }
    };

    const setStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
        setAttendance(new Map(attendance.set(studentId, status)));
    };

    // Create a map of student info for lookup
    const [studentInfo, setStudentInfo] = useState<Map<string, { roll_number: string; full_name: string }>>(new Map());

    // Store student info when page loads
    useEffect(() => {
        if (students.length > 0) {
            const newInfo = new Map(studentInfo);
            students.forEach((s: Student) => {
                newInfo.set(s.student_id, { roll_number: s.roll_number, full_name: s.full_name });
            });
            setStudentInfo(newInfo);
        }
    }, [students]);

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        } else {
            // Convert to array and complete - include student names
            const records: AttendanceRecord[] = Array.from(attendance.entries()).map(([student_id, status]) => {
                const info = studentInfo.get(student_id);
                return {
                    student_id,
                    status,
                    roll_number: info?.roll_number,
                    full_name: info?.full_name,
                };
            });
            onComplete(records);
        }
    };

    const handlePrev = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const progress = (currentPage / totalPages) * 100;
    const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE + 1;
    const endIndex = Math.min(currentPage * STUDENTS_PER_PAGE, totalStudents);

    return (
        <div>
            {/* Header Info */}
            <Card className="mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-text-primary">{classSubject.subject_name}</h3>
                        <p className="text-sm text-text-secondary">{classSubject.class_label}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-text-muted">Date</p>
                        <p className="text-sm font-medium text-text-primary">{date}</p>
                    </div>
                </div>
            </Card>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-text-secondary">
                        Students {startIndex}-{endIndex} of {totalStudents}
                    </span>
                    <span className="text-xs text-text-secondary">
                        Page {currentPage}/{totalPages}
                    </span>
                </div>
                <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Students List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="space-y-2 mb-4">
                    {students.map((student) => {
                        const status = attendance.get(student.student_id) || 'present';
                        return (
                            <div
                                key={student.student_id}
                                className={`p-3 rounded-lg border transition-colors ${status === 'present'
                                    ? 'bg-success/10 border-success/30'
                                    : status === 'absent'
                                        ? 'bg-error/10 border-error/30'
                                        : 'bg-warning/10 border-warning/30'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-text-primary">{student.full_name}</p>
                                        <p className="text-xs text-text-secondary">{student.roll_number}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setStatus(student.student_id, 'present')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${status === 'present'
                                                ? 'bg-success text-white'
                                                : 'bg-white/5 text-text-secondary hover:bg-success/20'
                                                }`}
                                        >
                                            P
                                        </button>
                                        <button
                                            onClick={() => setStatus(student.student_id, 'absent')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${status === 'absent'
                                                ? 'bg-error text-white'
                                                : 'bg-white/5 text-text-secondary hover:bg-error/20'
                                                }`}
                                        >
                                            A
                                        </button>
                                        <button
                                            onClick={() => setStatus(student.student_id, 'late')}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${status === 'late'
                                                ? 'bg-warning text-white'
                                                : 'bg-white/5 text-text-secondary hover:bg-warning/20'
                                                }`}
                                        >
                                            L
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
                <Button
                    variant="secondary"
                    onClick={currentPage === 1 ? onBack : handlePrev}
                    className="flex-1"
                >
                    {currentPage === 1 ? 'Cancel' : 'Previous'}
                </Button>
                <Button
                    variant="primary"
                    onClick={handleNext}
                    className="flex-1"
                >
                    {currentPage < totalPages ? 'Save & Next' : 'Review'}
                </Button>
            </div>
        </div>
    );
}

// ============================================
// Summary Component
// ============================================
interface SummaryProps {
    classSubject: AssignedClass;
    date: string;
    records: AttendanceRecord[];
    onEdit: () => void;
    onSubmit: () => void;
    submitting: boolean;
}

function AttendanceSummary({ classSubject, date, records, onEdit, onSubmit, submitting }: SummaryProps) {
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const absentStudents = records.filter(r => r.status === 'absent');

    return (
        <div>
            {/* Header */}
            <Card className="mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-text-primary">{classSubject.subject_name}</h3>
                        <p className="text-sm text-text-secondary">{classSubject.class_label}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-text-muted">Date</p>
                        <p className="text-sm font-medium text-text-primary">{date}</p>
                    </div>
                </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <Card className="text-center bg-success/10 border border-success/20">
                    <p className="text-2xl font-bold text-success">{presentCount}</p>
                    <p className="text-xs text-success/80">Present</p>
                </Card>
                <Card className="text-center bg-error/10 border border-error/20">
                    <p className="text-2xl font-bold text-error">{absentCount}</p>
                    <p className="text-xs text-error/80">Absent</p>
                </Card>
                <Card className="text-center bg-warning/10 border border-warning/20">
                    <p className="text-2xl font-bold text-warning">{lateCount}</p>
                    <p className="text-xs text-warning/80">Late</p>
                </Card>
            </div>

            {/* Total */}
            <Card className="mb-4">
                <div className="flex items-center justify-between">
                    <span className="text-text-secondary">Total Students</span>
                    <span className="font-bold text-text-primary">{records.length}</span>
                </div>
                <div className="mt-2 h-3 bg-bg-tertiary rounded-full overflow-hidden flex">
                    <div
                        className="h-full bg-success"
                        style={{ width: `${(presentCount / records.length) * 100}%` }}
                    />
                    <div
                        className="h-full bg-warning"
                        style={{ width: `${(lateCount / records.length) * 100}%` }}
                    />
                    <div
                        className="h-full bg-error"
                        style={{ width: `${(absentCount / records.length) * 100}%` }}
                    />
                </div>
                <div className="flex items-center justify-center mt-2 text-sm">
                    <span className="text-success font-medium">
                        {Math.round(((presentCount + lateCount) / records.length) * 100)}% Attendance
                    </span>
                </div>
            </Card>

            {/* Absent List */}
            {absentCount > 0 && (
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-text-secondary mb-2">Absent Students</h4>
                    <Card>
                        <div className="space-y-2">
                            {absentStudents.map((r, i) => (
                                <div key={r.student_id} className="flex items-center gap-2 text-sm">
                                    <span className="w-6 h-6 rounded-full bg-error/20 flex items-center justify-center text-error text-xs">
                                        {i + 1}
                                    </span>
                                    <span className="text-text-primary font-medium">{r.roll_number || 'N/A'}</span>
                                    <span className="text-text-secondary">-</span>
                                    <span className="text-text-primary">{r.full_name || 'Unknown'}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
                <Button
                    variant="secondary"
                    onClick={onEdit}
                    className="flex-1"
                    disabled={submitting}
                >
                    Edit
                </Button>
                <Button
                    variant="primary"
                    onClick={onSubmit}
                    className="flex-1"
                    loading={submitting}
                >
                    Submit Attendance
                </Button>
            </div>
        </div>
    );
}

// ============================================
// Attendance Stats Component
// ============================================
interface AttendanceStatsProps {
    classSubject: AssignedClass;
    onBack: () => void;
    onTakeAttendance: () => void;
}

function AttendanceStats({ classSubject, onBack, onTakeAttendance }: AttendanceStatsProps) {
    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState<AttendanceStatsData | null>(null);
    const [activeTab, setActiveTab] = useState<'students' | 'sessions'>('students');

    useEffect(() => {
        fetchStats();
    }, [classSubject]);

    const fetchStats = async () => {
        try {
            const response = await fetch(
                `${API_BASE}/attendance/class-subject/${classSubject.class_subject_id}/stats`
            );
            const data = await response.json();
            if (data.success) {
                setStatsData(data.data);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    if (!statsData) {
        return (
            <EmptyState
                icon={
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                }
                title="No data available"
                description="Start taking attendance to see statistics."
            />
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'good': return 'text-success bg-success/10';
            case 'warning': return 'text-warning bg-warning/10';
            case 'danger': return 'text-error bg-error/10';
            default: return 'text-text-muted bg-bg-tertiary';
        }
    };

    return (
        <div>
            {/* Header */}
            <Card className="mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-text-primary">{statsData.subject_name}</h3>
                        <p className="text-sm text-text-secondary">{statsData.class_label}</p>
                    </div>
                    <Button variant="primary" onClick={onTakeAttendance}>
                        Take Attendance
                    </Button>
                </div>
            </Card>

            {/* Overall Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <Card className="text-center">
                    <p className="text-2xl font-bold text-primary">{statsData.stats.total_sessions}</p>
                    <p className="text-xs text-text-muted">Classes Held</p>
                </Card>
                <Card className="text-center">
                    <p className="text-2xl font-bold text-text-primary">{statsData.stats.total_students}</p>
                    <p className="text-xs text-text-muted">Students</p>
                </Card>
                <Card className="col-span-2 text-center">
                    <p className={`text-3xl font-bold ${statsData.stats.average_percentage >= 75 ? 'text-success' : statsData.stats.average_percentage >= 65 ? 'text-warning' : 'text-error'}`}>
                        {statsData.stats.average_percentage}%
                    </p>
                    <p className="text-xs text-text-muted">Average Attendance</p>
                </Card>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('students')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'students'
                        ? 'bg-primary text-white'
                        : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                        }`}
                >
                    Students ({statsData.students.length})
                </button>
                <button
                    onClick={() => setActiveTab('sessions')}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${activeTab === 'sessions'
                        ? 'bg-primary text-white'
                        : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary'
                        }`}
                >
                    Sessions ({statsData.sessions.length})
                </button>
            </div>

            {/* Students Tab */}
            {activeTab === 'students' && (
                <div className="space-y-2">
                    {statsData.students.length === 0 ? (
                        <Card className="text-center py-8">
                            <p className="text-text-muted">No attendance data yet</p>
                        </Card>
                    ) : (
                        statsData.students.map((student) => (
                            <Card key={student.student_id} className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-text-primary truncate">{student.full_name}</p>
                                    <p className="text-xs text-text-muted">{student.roll_number}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="text-xs text-text-muted">
                                            {student.classes_attended}/{student.total_classes}
                                        </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg text-sm font-bold ${getStatusColor(student.status)}`}>
                                        {student.percentage}%
                                    </span>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
                <div className="space-y-2">
                    {statsData.sessions.length === 0 ? (
                        <Card className="text-center py-8">
                            <p className="text-text-muted">No sessions taken yet</p>
                        </Card>
                    ) : (
                        statsData.sessions.map((session) => (
                            <Card key={session.id} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-text-primary">
                                        {new Date(session.conducted_date).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                    <p className="text-xs text-text-muted">
                                        {session.conducted_time?.slice(0, 5) || 'N/A'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-success">{session.total_present || 0}</p>
                                        <p className="text-xs text-text-muted">Present</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-error">{session.total_absent || 0}</p>
                                        <p className="text-xs text-text-muted">Absent</p>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Back Button */}
            <div className="mt-6">
                <Button variant="secondary" onClick={onBack} className="w-full">
                    Back to Classes
                </Button>
            </div>
        </div>
    );
}

// ============================================
// Main Attendance Component
// ============================================
export default function Attendance() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    useParams(); // Can be used for direct URL access in the future

    const [step, setStep] = useState<'select' | 'mark' | 'summary' | 'stats'>('select');
    const [selectedClass, setSelectedClass] = useState<AssignedClass | null>(null);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0] ?? '');
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Check if coming from Home with class info
    useEffect(() => {
        if (location.state?.classSubject) {
            setSelectedClass(location.state.classSubject);
            setAttendanceDate(location.state.date || new Date().toISOString().split('T')[0]);
            setStep('mark');
        }
    }, [location.state]);

    const handleClassSelect = (cls: AssignedClass) => {
        setSelectedClass(cls);
        setStep('mark');
    };

    const handleViewStats = (cls: AssignedClass) => {
        setSelectedClass(cls);
        setStep('stats');
    };

    const handleMarkingComplete = (newRecords: AttendanceRecord[]) => {
        setRecords(newRecords);
        setStep('summary');
    };

    const handleEdit = () => {
        setStep('mark');
    };

    const handleSubmit = async () => {
        if (!selectedClass || !user) return;

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/attendance?user_id=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    class_subject_id: selectedClass.class_subject_id,
                    conducted_date: attendanceDate,
                    conducted_time: new Date().toTimeString().slice(0, 8),
                    attendance_records: records,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    navigate('/home');
                }, 2000);
            } else {
                alert(data.message || 'Failed to submit attendance');
            }
        } catch (err) {
            console.error('Error submitting attendance:', err);
            alert('Failed to submit attendance. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Success Screen
    if (success) {
        return (
            <PageContainer noBottomNav>
                <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
                    <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4 animate-bounce">
                        <svg className="w-10 h-10 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-text-primary mb-2">Attendance Submitted!</h2>
                    <p className="text-text-secondary">Redirecting to home...</p>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer
            header={
                <Header
                    title={step === 'select' ? 'Take Attendance' : step === 'stats' ? 'Attendance Stats' : selectedClass?.subject_name || 'Attendance'}
                    showBack={step !== 'select'}
                    onBack={() => {
                        if (step === 'summary') setStep('mark');
                        else if (step === 'mark' || step === 'stats') {
                            setSelectedClass(null);
                            setStep('select');
                        }
                    }}
                    showNotification={false}
                />
            }
        >
            {step === 'select' && (
                <ClassSelection onSelect={handleClassSelect} onViewStats={handleViewStats} />
            )}

            {step === 'mark' && selectedClass && (
                <AttendanceMarking
                    classSubject={selectedClass}
                    date={attendanceDate}
                    onComplete={handleMarkingComplete}
                    onBack={() => {
                        setSelectedClass(null);
                        setStep('select');
                    }}
                />
            )}

            {step === 'summary' && selectedClass && (
                <AttendanceSummary
                    classSubject={selectedClass}
                    date={attendanceDate}
                    records={records}
                    onEdit={handleEdit}
                    onSubmit={handleSubmit}
                    submitting={submitting}
                />
            )}

            {step === 'stats' && selectedClass && (
                <AttendanceStats
                    classSubject={selectedClass}
                    onBack={() => {
                        setSelectedClass(null);
                        setStep('select');
                    }}
                    onTakeAttendance={() => setStep('mark')}
                />
            )}
        </PageContainer>
    );
}
