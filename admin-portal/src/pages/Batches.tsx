// ============================================
// Admin Portal - Batches Page
// ============================================

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    Calendar,
    Users,
    ChevronRight,
    X,
    Loader2,
    AlertCircle,
    CheckCircle,
    Building2,
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

interface Batch {
    id: string;
    batch_name: string;
    batch_year: number;
    is_active: boolean;
    student_count?: number;
    course_count?: number;
}

// ============================================
// Batches Page
// ============================================

export default function Batches() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        batch_name: '',
        batch_year: new Date().getFullYear(),
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch batches with stats
    const { data: batches = [], isLoading: loading } = useQuery<Batch[]>({
        queryKey: ['batches'],
        queryFn: async () => {
            if (!supabase) return [];

            // Fetch batches
            const { data: batchesData, error } = await supabase
                .from('batches')
                .select('*')
                .order('batch_year', { ascending: false });

            if (error) throw error;

            // Get course count and student count for each batch
            const batchesWithStats = await Promise.all(
                (batchesData || []).map(async (batch) => {
                    // Count courses linked to this batch
                    const { count: courseCount } = await supabase
                        .from('batch_courses')
                        .select('id', { count: 'exact', head: true })
                        .eq('batch_id', batch.id)
                        .eq('is_active', true);

                    // Get classes for this batch first
                    const { data: classesData } = await supabase
                        .from('classes')
                        .select('id')
                        .eq('batch_id', batch.id);

                    const classIds = (classesData || []).map(c => c.id);

                    // Count students in those classes
                    let studentCount = 0;
                    if (classIds.length > 0) {
                        const { count } = await supabase
                            .from('class_students')
                            .select('id', { count: 'exact', head: true })
                            .eq('is_active', true)
                            .in('class_id', classIds);
                        studentCount = count || 0;
                    }

                    return {
                        ...batch,
                        course_count: courseCount || 0,
                        student_count: studentCount
                    };
                })
            );

            return batchesWithStats;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (submitData: any) => {
            const response = await fetch('http://localhost:4003/api/admin/v1/academic/batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create batch');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['batches'] });
            setSuccessMessage('Batch created successfully!');
            setIsModalOpen(false);
            setFormData({
                batch_name: '',
                batch_year: new Date().getFullYear(),
            });
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error: Error) => {
            setErrorMessage(error.message);
        }
    });

    // Handle create batch
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        createMutation.mutate(formData);
    };

    // Auto-generate batch name
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            batch_name: `${prev.batch_year}-${prev.batch_year + 4}`,
        }));
    }, [formData.batch_year]);

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
                    <button onClick={() => setErrorMessage('')} className="ml-auto">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Batches</h1>
                    <p className="text-text-secondary mt-1">Manage academic batches (year groups)</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg shadow-glow-indigo hover:-translate-y-0.5 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Create Batch
                </button>
            </div>

            {/* Batches Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-6 animate-pulse">
                            <div className="h-6 bg-white/5 rounded w-32 mb-4" />
                            <div className="h-4 bg-white/5 rounded w-24 mb-6" />
                            <div className="flex gap-4">
                                <div className="h-10 bg-white/5 rounded flex-1" />
                                <div className="h-10 bg-white/5 rounded flex-1" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : batches.length === 0 ? (
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-12 text-center">
                    <Building2 className="w-16 h-16 text-text-muted mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">No Batches Yet</h3>
                    <p className="text-text-secondary mb-6">Create your first batch to start organizing students</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg"
                    >
                        <Plus className="w-4 h-4" />
                        Create Batch
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {batches.map((batch) => (
                        <div
                            key={batch.id}
                            onClick={() => navigate(`/batches/${batch.id}`)}
                            className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-6 cursor-pointer hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors">
                                        {batch.batch_name}
                                    </h3>
                                    <p className="text-text-secondary text-sm mt-1">
                                        {batch.batch_year} - {batch.batch_year + 4}
                                    </p>
                                </div>
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${batch.is_active ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                                        }`}
                                >
                                    {batch.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <div className="flex gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-text-muted" />
                                    <span className="text-text-secondary text-sm">
                                        {batch.student_count ?? 0} students
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-text-muted" />
                                    <span className="text-text-secondary text-sm">
                                        {batch.course_count ?? 0} courses
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <span className="text-sm text-text-muted">View Details</span>
                                <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Batch Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-text-primary">Create Batch</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Batch Name</label>
                                <input
                                    type="text"
                                    value={formData.batch_name}
                                    onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                    placeholder="2024-2028"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Batch Year</label>
                                <input
                                    type="number"
                                    value={formData.batch_year}
                                    onChange={(e) => setFormData({ ...formData, batch_year: parseInt(e.target.value) })}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                    min="2000"
                                    max="2100"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-white/10 text-text-secondary rounded-lg hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create Batch
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
