// ============================================
// Admin Portal - Courses Page
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    BookOpen,
    Search,
    Filter,
    X,
    Loader2,
    AlertCircle,
    CheckCircle,
    Edit,
    GitBranch,
    Clock,
    GraduationCap,
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
    total_semesters: number;
    degree_type?: string;
    is_active: boolean;
    branch_count?: number;
}

// ============================================
// Courses Page
// ============================================

export default function Courses() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [formData, setFormData] = useState({
        course_name: '',
        course_code: '',
        duration_years: 4,
        total_semesters: 8,
        degree_type: '',
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch courses
    const { data: courses = [], isLoading: loading } = useQuery({
        queryKey: ['courses'],
        queryFn: async () => {
            if (!supabase) return [];

            const { data: coursesData, error } = await supabase
                .from('courses')
                .select('*')
                .order('course_name');

            if (error) throw error;

            const coursesWithCounts = await Promise.all(
                (coursesData || []).map(async (course) => {
                    const { count } = await supabase
                        .from('branches')
                        .select('id', { count: 'exact', head: true })
                        .eq('course_id', course.id)
                        .eq('is_active', true);

                    return {
                        ...course,
                        branch_count: count || 0
                    };
                })
            );

            return coursesWithCounts as Course[];
        }
    });

    // Handle create course
    const createMutation = useMutation({
        mutationFn: async (newCourse: any) => {
            const response = await fetch('http://localhost:4003/api/admin/v1/academic/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCourse),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create course');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            setSuccessMessage('Course created successfully!');
            setIsModalOpen(false);
            setFormData({ course_name: '', course_code: '', duration_years: 4, total_semesters: 8, degree_type: '' });
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error: Error) => {
            setErrorMessage(error.message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        createMutation.mutate(formData);
    };

    // Handle edit course
    const editMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const response = await fetch(`http://localhost:4003/api/admin/v1/academic/courses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update course');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            setSuccessMessage('Course updated successfully!');
            setIsEditModalOpen(false);
            setEditingCourse(null);
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error: Error) => {
            setErrorMessage(error.message);
        }
    });

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCourse) return;
        setErrorMessage('');
        editMutation.mutate({ id: editingCourse.id, data: formData });
    };

    // Open edit modal
    const openEditModal = (course: Course) => {
        setEditingCourse(course);
        setFormData({
            course_name: course.course_name,
            course_code: course.course_code,
            duration_years: course.duration_years,
            total_semesters: course.total_semesters || course.duration_years * 2,
            degree_type: course.degree_type || '',
        });
        setIsEditModalOpen(true);
    };

    // Filter courses
    const filteredCourses = courses.filter((course) => {
        const matchesSearch =
            course.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.course_code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && course.is_active) ||
            (filterStatus === 'inactive' && !course.is_active);
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-white/5 rounded w-48 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
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

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Courses</h1>
                    <p className="text-text-secondary">Manage all courses and their branches</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg"
                >
                    <Plus className="w-4 h-4" />
                    Add Course
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-text-muted" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-text-primary">{courses.length}</p>
                            <p className="text-xs text-text-muted">Total Courses</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-success" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-text-primary">{courses.filter(c => c.is_active).length}</p>
                            <p className="text-xs text-text-muted">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                            <GitBranch className="w-5 h-5 text-secondary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-text-primary">{courses.reduce((sum, c) => sum + (c.branch_count || 0), 0)}</p>
                            <p className="text-xs text-text-muted">Total Branches</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent-teal/20 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-accent-teal" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-text-primary">{new Set(courses.map(c => c.degree_type).filter(Boolean)).size}</p>
                            <p className="text-xs text-text-muted">Degree Types</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            {filteredCourses.length === 0 ? (
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-12 text-center">
                    <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No Courses Found</h3>
                    <p className="text-text-secondary mb-4">
                        {searchQuery ? 'No courses match your search' : 'Create your first course to get started'}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary to-primary text-white rounded-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Add Course
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCourses.map((course) => (
                        <div
                            key={course.id}
                            className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-6 hover:border-primary/50 hover:-translate-y-1 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <BookOpen className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-text-muted bg-white/5 px-2 py-1 rounded">
                                        {course.course_code}
                                    </span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openEditModal(course); }}
                                        className="p-1.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-semibold text-text-primary mb-1 group-hover:text-primary transition-colors">
                                {course.course_name}
                            </h3>

                            <div className="flex items-center gap-4 text-sm text-text-secondary mt-3">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {course.duration_years} Years
                                </span>
                                <span className="flex items-center gap-1">
                                    <GitBranch className="w-4 h-4" />
                                    {course.branch_count || 0} Branches
                                </span>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.is_active ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                                    {course.is_active ? 'Active' : 'Inactive'}
                                </span>
                                {course.degree_type && (
                                    <span className="text-xs text-text-muted">{course.degree_type}</span>
                                )}
                            </div>

                            <button
                                onClick={() => navigate(`/courses/${course.id}`)}
                                className="w-full mt-4 px-4 py-2 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors"
                            >
                                View Batches & Classes
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Course Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-text-primary">Create Course</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Course Name *</label>
                                <input
                                    type="text"
                                    value={formData.course_name}
                                    onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                    placeholder="e.g., Bachelor of Technology"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Course Code *</label>
                                    <input
                                        type="text"
                                        value={formData.course_code}
                                        onChange={(e) => setFormData({ ...formData, course_code: e.target.value.toUpperCase() })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                        placeholder="e.g., BTECH"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Duration (Years)</label>
                                    <input
                                        type="number"
                                        value={formData.duration_years}
                                        onChange={(e) => {
                                            const years = parseInt(e.target.value);
                                            setFormData({
                                                ...formData,
                                                duration_years: years,
                                                total_semesters: years * 2
                                            });
                                        }}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                        min="1"
                                        max="6"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Total Semesters</label>
                                    <input
                                        type="number"
                                        value={formData.total_semesters}
                                        onChange={(e) => setFormData({ ...formData, total_semesters: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                        min="1"
                                        max="12"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Degree Type</label>
                                    <select
                                        value={formData.degree_type}
                                        onChange={(e) => setFormData({ ...formData, degree_type: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                    >
                                        <option value="">Select type</option>
                                        <option value="Bachelor">Bachelor</option>
                                        <option value="Master">Master</option>
                                        <option value="Diploma">Diploma</option>
                                        <option value="PhD">PhD</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 border border-white/10 text-text-secondary rounded-lg hover:bg-white/5">
                                    Cancel
                                </button>
                                <button type="submit" disabled={createMutation.isPending} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                                    {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Create Course
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Course Modal */}
            {isEditModalOpen && editingCourse && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-text-primary">Edit Course</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Course Name *</label>
                                <input
                                    type="text"
                                    value={formData.course_name}
                                    onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Course Code</label>
                                    <input
                                        type="text"
                                        value={formData.course_code}
                                        disabled
                                        className="w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg text-text-muted cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Duration (Years)</label>
                                    <input
                                        type="number"
                                        value={formData.duration_years}
                                        onChange={(e) => setFormData({ ...formData, duration_years: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                        min="1"
                                        max="6"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Total Semesters</label>
                                    <input
                                        type="number"
                                        value={formData.total_semesters}
                                        onChange={(e) => setFormData({ ...formData, total_semesters: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                        min="1"
                                        max="12"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Degree Type</label>
                                    <select
                                        value={formData.degree_type}
                                        onChange={(e) => setFormData({ ...formData, degree_type: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                    >
                                        <option value="">Select type</option>
                                        <option value="Bachelor">Bachelor</option>
                                        <option value="Master">Master</option>
                                        <option value="Diploma">Diploma</option>
                                        <option value="PhD">PhD</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2.5 border border-white/10 text-text-secondary rounded-lg hover:bg-white/5">
                                    Cancel
                                </button>
                                <button type="submit" disabled={editMutation.isPending} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-accent-teal to-primary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                                    {editMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
