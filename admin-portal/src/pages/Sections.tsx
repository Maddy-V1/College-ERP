// ============================================
// Admin Portal - Sections Page
// ============================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Plus,
    ChevronRight,
    ArrowLeft,
    Users,
    X,
    Loader2,
    AlertCircle,
    CheckCircle,
    LayoutGrid,
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

interface Class {
    id: string;
    class_label: string;
    current_strength?: number;
    class_teacher_id?: string;
    is_active?: boolean;
}

interface Branch {
    id: string;
    branch_name: string;
    branch_code: string;
}

interface Course {
    id: string;
    course_name: string;
    course_code: string;
}

interface Batch {
    id: string;
    batch_name: string;
}

// ============================================
// Sections Page
// ============================================

export default function Sections() {
    const { batchId, courseId, branchId } = useParams<{ batchId: string; courseId: string; branchId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        section_letter: '',
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch data
    const { data, isLoading: loading, error } = useQuery({
        queryKey: ['sectionsData', batchId, courseId, branchId],
        queryFn: async () => {
            if (!supabase || !branchId || !courseId || !batchId) {
                return { batch: null, course: null, branch: null, classes: [] };
            }

            const [batchRes, courseRes, branchRes, classesRes] = await Promise.all([
                supabase.from('batches').select('id, batch_name').eq('id', batchId).single(),
                supabase.from('courses').select('id, course_name, course_code').eq('id', courseId).single(),
                supabase.from('branches').select('id, branch_name, branch_code').eq('id', branchId).single(),
                supabase.from('classes').select('*').eq('branch_id', branchId).eq('batch_id', batchId).order('class_label'),
            ]);

            if (batchRes.error) throw batchRes.error;
            if (courseRes.error) throw courseRes.error;
            if (branchRes.error) throw branchRes.error;

            return {
                batch: batchRes.data as Batch,
                course: courseRes.data as Course,
                branch: branchRes.data as Branch,
                classes: (classesRes.data as Class[]) || []
            };
        }
    });

    // Provide default empty objects/arrays to avoid null checks down the line
    const batch = data?.batch;
    const course = data?.course;
    const branch = data?.branch;
    const classes = data?.classes || [];

    // Optionally set error message if one occurs during queries
    if (error && !errorMessage) {
        setErrorMessage('Failed to load sections');
    }

    const createMutation = useMutation({
        mutationFn: async (submitData: any) => {
            const response = await fetch('http://localhost:4003/api/admin/v1/academic/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create class');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sectionsData'] });
            setSuccessMessage('Section created successfully!');
            setIsModalOpen(false);
            setFormData({ section_letter: '' });
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error: Error) => {
            setErrorMessage(error.message);
        }
    });

    // Handle create section/class
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        const classLabel = `${batch?.batch_name?.split('-')[0] || ''}-${branch?.branch_code || ''}-${formData.section_letter}`;

        createMutation.mutate({
            class_label: classLabel,
            batch_id: batchId,
            branch_id: branchId,
        });
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-white/5 rounded w-80 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

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
            <nav className="flex items-center gap-2 text-sm flex-wrap">
                <Link to="/batches" className="text-text-secondary hover:text-primary">Batches</Link>
                <ChevronRight className="w-4 h-4 text-text-muted" />
                <Link to={`/batches/${batchId}`} className="text-text-secondary hover:text-primary">{batch?.batch_name}</Link>
                <ChevronRight className="w-4 h-4 text-text-muted" />
                <Link to={`/batches/${batchId}/courses/${courseId}`} className="text-text-secondary hover:text-primary">{course?.course_code}</Link>
                <ChevronRight className="w-4 h-4 text-text-muted" />
                <span className="text-text-primary font-medium">{branch?.branch_code} Sections</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(`/batches/${batchId}/courses/${courseId}`)}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">{branch?.branch_name}</h1>
                        <p className="text-text-secondary">
                            {batch?.batch_name} | {course?.course_code}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent-teal to-primary text-white font-semibold rounded-lg"
                >
                    <Plus className="w-4 h-4" />
                    Add Section
                </button>
            </div>

            {/* Sections Grid */}
            {classes.length === 0 ? (
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-12 text-center">
                    <LayoutGrid className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No Sections Yet</h3>
                    <p className="text-text-secondary mb-4">Create sections (A, B, C, etc.) for this branch</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-teal to-primary text-white rounded-lg"
                    >
                        <Plus className="w-4 h-4" />
                        Add Section
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map((cls) => {
                        const sectionLetter = cls.class_label?.split('-').pop() || '?';
                        return (
                            <div
                                key={cls.id}
                                onClick={() => navigate(`/classes/${cls.id}`)}
                                className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-6 cursor-pointer hover:border-accent-orange/50 hover:-translate-y-1 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-14 h-14 rounded-xl bg-accent-orange/10 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-accent-orange">{sectionLetter}</span>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${cls.is_active !== false ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                                        {cls.is_active !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-text-primary mb-3 group-hover:text-accent-orange transition-colors">
                                    {cls.class_label}
                                </h3>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-text-muted" />
                                        <span className="text-sm text-text-secondary">{cls.current_strength || 0} students</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                    <span className="text-sm text-text-muted">Manage Class</span>
                                    <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-accent-orange group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Section Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-sm">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-text-primary">Add Section</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Section Letter</label>
                                <input
                                    type="text"
                                    value={formData.section_letter}
                                    onChange={(e) => setFormData({ ...formData, section_letter: e.target.value.toUpperCase() })}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary text-center text-2xl font-bold focus:outline-none focus:border-primary"
                                    placeholder="A"
                                    maxLength={1}
                                    required
                                />
                                <p className="text-text-muted text-xs mt-1 text-center">
                                    Class: {batch?.batch_name?.split('-')[0]}-{branch?.branch_code}-{formData.section_letter || '?'}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-white/10 text-text-secondary rounded-lg hover:bg-white/5">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createMutation.isPending || !formData.section_letter} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-accent-teal to-primary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                                    {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
