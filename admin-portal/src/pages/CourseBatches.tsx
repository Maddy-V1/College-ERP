// ============================================
// Admin Portal - Course Batches Page
// Shows batches linked to a specific course
// ============================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Plus,
    ChevronRight,
    ArrowLeft,
    Layers,
    X,
    Loader2,
    AlertCircle,
    CheckCircle,
    BookOpen,
    GitBranch,
    Users,
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

interface Course {
    id: string;
    course_name: string;
    course_code: string;
    duration_years: number;
}

interface Batch {
    id: string;
    batch_name: string;
    batch_year: number;
    is_active: boolean;
    class_count?: number;
    student_count?: number;
}

interface Branch {
    id: string;
    branch_name: string;
    branch_code: string;
}

// ============================================
// Course Batches Page
// ============================================

export default function CourseBatches() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [selectedBatchId, setSelectedBatchId] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch course, its branches, and linked batches
    const { data: { course, branches, linkedBatches, allBatches } = { course: null, branches: [], linkedBatches: [], allBatches: [] }, isLoading: loading, error } = useQuery({
        queryKey: ['courseBatches', courseId],
        queryFn: async () => {
            if (!supabase || !courseId) return { course: null, branches: [], linkedBatches: [], allBatches: [] };

            // Fetch course
            const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .select('*')
                .eq('id', courseId)
                .single();

            if (courseError) throw courseError;

            // Fetch branches for this course
            const { data: branchesData } = await supabase
                .from('branches')
                .select('id, branch_name, branch_code')
                .eq('course_id', courseId)
                .eq('is_active', true)
                .order('branch_name');

            // Fetch ALL batches
            const { data: allBatchesData } = await supabase
                .from('batches')
                .select('*')
                .order('batch_year', { ascending: false });

            // Fetch batches linked to this course via batch_courses
            const { data: batchCoursesData, error: bcError } = await supabase
                .from('batch_courses')
                .select(`
                    batch_id,
                    batches(
                        id,
                        batch_name,
                        batch_year,
                        is_active
                    )
                `)
                .eq('course_id', courseId)
                .eq('is_active', true);

            if (bcError) throw bcError;

            // Extract batches and get class/student counts
            const batchesWithCounts = await Promise.all(
                (batchCoursesData || []).map(async (bc: any) => {
                    const batch = bc.batches;
                    if (!batch) return null;

                    // Count classes for this batch + course combination
                    const branchIds = branchesData?.map(b => b.id) || [];
                    let classCount = 0;
                    let studentCount = 0;

                    if (branchIds.length > 0) {
                        const { count } = await supabase
                            .from('classes')
                            .select('id', { count: 'exact', head: true })
                            .eq('batch_id', batch.id)
                            .in('branch_id', branchIds);
                        classCount = count || 0;

                        // Get class IDs for student count
                        const { data: classesData } = await supabase
                            .from('classes')
                            .select('id')
                            .eq('batch_id', batch.id)
                            .in('branch_id', branchIds);

                        if (classesData && classesData.length > 0) {
                            const classIds = classesData.map(c => c.id);
                            const { count: sCount } = await supabase
                                .from('class_students')
                                .select('id', { count: 'exact', head: true })
                                .eq('is_active', true)
                                .in('class_id', classIds);
                            studentCount = sCount || 0;
                        }
                    }

                    return {
                        ...batch,
                        class_count: classCount,
                        student_count: studentCount
                    };
                })
            );

            return {
                course: courseData as Course,
                branches: (branchesData || []) as Branch[],
                allBatches: (allBatchesData || []) as Batch[],
                linkedBatches: batchesWithCounts.filter((b): b is Batch => b !== null)
            };
        }
    });

    if (error && !errorMessage) {
        setErrorMessage('Failed to load course details');
    }

    // Link batch to course
    const linkMutation = useMutation({
        mutationFn: async () => {
            if (!supabase || !courseId || !selectedBatchId) throw new Error('Missing Supabase client, course ID, or batch ID');
            const { error } = await supabase
                .from('batch_courses')
                .insert({ batch_id: selectedBatchId, course_id: courseId });

            if (error) {
                if (error.code === '23505') {
                    throw new Error('This batch is already linked to this course');
                } else {
                    throw error;
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courseBatches', courseId] });
            setSuccessMessage('Batch linked successfully!');
            setIsLinkModalOpen(false);
            setSelectedBatchId('');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error: Error) => {
            setErrorMessage(error.message || 'Failed to link batch');
        }
    });

    // Link batch to course
    const handleLinkBatch = () => {
        setErrorMessage('');
        linkMutation.mutate();
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-white/5 rounded w-48 animate-pulse" />
                <div className="h-24 bg-white/5 rounded animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-40 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-text-primary">Course not found</h2>
                <button onClick={() => navigate('/courses')} className="mt-4 text-primary hover:underline">
                    Go back to Courses
                </button>
            </div>
        );
    }

    // Get batches not yet linked
    const unlinkedBatches = allBatches.filter(b => !linkedBatches.some(lb => lb.id === b.id));

    return (
        <div className="space-y-6">
            {/* Messages */}
            {successMessage && (
                <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-lg text-success">
                    <CheckCircle className="w-5 h-5" />
                    <p>{successMessage}</p>
                </div>
            )}
            {errorMessage && (
                <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/30 rounded-lg text-error">
                    <AlertCircle className="w-5 h-5" />
                    <p>{errorMessage}</p>
                    <button onClick={() => setErrorMessage('')} className="ml-auto"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm">
                <Link to="/courses" className="text-text-secondary hover:text-primary">Courses</Link>
                <ChevronRight className="w-4 h-4 text-text-muted" />
                <span className="text-text-primary font-medium">{course.course_name}</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/courses')}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-text-primary">{course.course_name}</h1>
                            <span className="text-xs font-mono text-text-muted bg-white/5 px-2 py-1 rounded">
                                {course.course_code}
                            </span>
                        </div>
                        <p className="text-text-secondary">Select a batch to manage classes</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(`/courses/${courseId}/branches`)}
                        className="flex items-center gap-2 px-4 py-2.5 border border-white/10 text-text-secondary rounded-lg hover:bg-white/5"
                    >
                        <GitBranch className="w-4 h-4" />
                        Manage Branches
                    </button>
                    <button
                        onClick={() => setIsLinkModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg"
                    >
                        <Plus className="w-4 h-4" />
                        Link Batch
                    </button>
                </div>
            </div>

            {/* Course Info Card */}
            <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                        <p className="text-text-muted text-sm">Course Code</p>
                        <p className="text-text-primary font-semibold mt-1">{course.course_code}</p>
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Duration</p>
                        <p className="text-text-primary font-semibold mt-1">{course.duration_years} Years</p>
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Branches</p>
                        <p className="text-text-primary font-semibold mt-1">{branches.length}</p>
                    </div>
                    <div>
                        <p className="text-text-muted text-sm">Linked Batches</p>
                        <p className="text-text-primary font-semibold mt-1">{linkedBatches.length}</p>
                    </div>
                </div>
            </div>

            {/* Batches Section */}
            <div>
                <h2 className="text-lg font-semibold text-text-primary mb-4">Batches Offering This Course</h2>

                {linkedBatches.length === 0 ? (
                    <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-12 text-center">
                        <Layers className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-text-primary mb-2">No Batches Linked</h3>
                        <p className="text-text-secondary mb-4">Link batches to offer this course to students</p>
                        <button
                            onClick={() => setIsLinkModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary to-primary text-white rounded-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Link Batch
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {linkedBatches.map((batch) => (
                            <div
                                key={batch.id}
                                onClick={() => navigate(`/courses/${courseId}/batches/${batch.id}`)}
                                className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-6 cursor-pointer hover:border-primary/50 hover:-translate-y-1 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                                        <Layers className="w-6 h-6 text-secondary" />
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${batch.is_active ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                                        {batch.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-text-primary mb-1 group-hover:text-primary transition-colors">
                                    {batch.batch_name}
                                </h3>
                                <p className="text-sm text-text-muted">Year: {batch.batch_year}</p>

                                <div className="flex items-center gap-4 text-sm text-text-secondary mt-3">
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="w-4 h-4" />
                                        {batch.class_count || 0} Classes
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        {batch.student_count || 0} Students
                                    </span>
                                </div>

                                <div className="mt-4 pt-4 border-t border-white/5 text-sm text-primary group-hover:underline">
                                    View Branches & Classes →
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Link Batch Modal */}
            {isLinkModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-text-primary">Link Batch to Course</h2>
                            <button onClick={() => setIsLinkModalOpen(false)} className="p-2 text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Select Batch</label>
                                <select
                                    value={selectedBatchId}
                                    onChange={(e) => setSelectedBatchId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                >
                                    <option value="">Choose a batch...</option>
                                    {unlinkedBatches.map((batch) => (
                                        <option key={batch.id} value={batch.id}>
                                            {batch.batch_name} ({batch.batch_year})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {unlinkedBatches.length === 0 && (
                                <p className="text-sm text-warning">All batches are already linked to this course.</p>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsLinkModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-white/10 text-text-secondary rounded-lg hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLinkBatch}
                                    disabled={linkMutation.isPending || !selectedBatchId}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {linkMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Link Batch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
