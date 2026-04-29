// ============================================
// Admin Portal - Students Page
// ============================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle,
    CheckCircle,
    User,
    Mail,
    Phone,
    Calendar,
    Hash,
    GraduationCap,
    Lock,
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

interface Student {
    id: string;
    user_id: string;
    roll_number: string;
    enrollment_number: string | null;
    full_name: string;
    email: string;
    phone: string | null;
    department_id: string | null;
    department_name: string | null;
    admission_year: number | null;
    gender: string | null;
    date_of_birth: string | null;
    is_active: boolean;
}

interface Batch {
    id: string;
    batch_name: string;
    batch_year: number;
}

interface StudentFormData {
    full_name: string;
    email: string;
    password: string;
    phone: string;
    roll_number: string;
    enrollment_number: string;
    admission_year: string;
    gender: string;
    date_of_birth: string;
    department_id: string;
}

// ============================================
// Students Management Page
// ============================================

export default function Students() {
    const queryClient = useQueryClient();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBatch, setFilterBatch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [formData, setFormData] = useState<StudentFormData>({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        roll_number: '',
        enrollment_number: '',
        admission_year: new Date().getFullYear().toString(),
        gender: '',
        date_of_birth: '',
        department_id: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch filters
    const { data: filtersData } = useQuery({
        queryKey: ['filters'],
        queryFn: async () => {
            if (!supabase) return { batches: [], courses: [] };

            const [batchesRes] = await Promise.all([
                supabase.from('batches').select('id, batch_name, batch_year').eq('is_active', true).order('batch_year', { ascending: false }),
            ]);

            return { batches: (batchesRes.data as Batch[]) || [] };
        }
    });

    const batches: Batch[] = filtersData?.batches || [];

    // Fetch students via API
    const { data: studentsData, isLoading: loading } = useQuery({
        queryKey: ['students', searchQuery, filterBatch, filterStatus, currentPage, pageSize],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (filterBatch) params.append('batch', filterBatch);
            if (filterStatus !== 'all') params.append('status', filterStatus);
            params.append('page', currentPage.toString());
            params.append('limit', pageSize.toString());

            const response = await fetch(
                `http://localhost:4003/api/admin/v1/students?${params.toString()}`
            );

            if (!response.ok) throw new Error('Failed to fetch students');
            const result = await response.json();

            if (!result.success) throw new Error(result.message || 'Failed to load students');
            return result;
        }
    });

    const students: Student[] = studentsData?.data || [];
    const totalCount = studentsData?.pagination?.total || 0;

    // Form validation
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.full_name.trim()) {
            errors.full_name = 'Full name is required';
        }
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }
        if (!formData.roll_number.trim()) {
            errors.roll_number = 'Roll number is required';
        }
        if (!formData.admission_year) {
            errors.admission_year = 'Admission year is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const saveMutation = useMutation({
        mutationFn: async (submitData: any) => {
            const response = await fetch(
                editingStudent
                    ? `http://localhost:4003/api/admin/v1/students/${editingStudent.id}`
                    : 'http://localhost:4003/api/admin/v1/students',
                {
                    method: editingStudent ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(submitData),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save student');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            setSuccessMessage(editingStudent ? 'Student updated successfully!' : 'Student registered successfully!');
            setIsModalOpen(false);
            resetForm();
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error: Error) => {
            setErrorMessage(error.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (student: Student) => {
            const response = await fetch(
                `http://localhost:4003/api/admin/v1/students/${student.id}`,
                { method: 'DELETE' }
            );
            if (!response.ok) throw new Error('Failed to delete student');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            setSuccessMessage('Student deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: () => {
            setErrorMessage('Failed to delete student');
        }
    });

    // Handle form submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setErrorMessage('');

        const submitData = {
            ...formData,
            admission_year: parseInt(formData.admission_year),
            ...(editingStudent && { password: undefined }), // Remove password from update
        };

        saveMutation.mutate(submitData);
    };

    // Handle delete
    const handleDelete = (student: Student) => {
        if (!confirm(`Are you sure you want to delete ${student.full_name}?`)) return;
        setErrorMessage('');
        deleteMutation.mutate(student);
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            full_name: '',
            email: '',
            password: '',
            phone: '',
            roll_number: '',
            enrollment_number: '',
            admission_year: new Date().getFullYear().toString(),
            gender: '',
            date_of_birth: '',
            department_id: '',
        });
        setFormErrors({});
        setEditingStudent(null);
    };

    // Open edit modal
    const openEditModal = (student: Student) => {
        setEditingStudent(student);
        setFormData({
            full_name: student.full_name,
            email: student.email,
            password: '', // Don't prefill password on edit
            phone: student.phone || '',
            roll_number: student.roll_number,
            enrollment_number: student.enrollment_number || '',
            admission_year: student.admission_year?.toString() || '',
            gender: student.gender || '',
            date_of_birth: student.date_of_birth || '',
            department_id: student.department_id || '',
        });
        setIsModalOpen(true);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    // Get unique years for filter
    const admissionYears = [...new Set(students.map((s: Student) => s.admission_year).filter(Boolean))].sort((a, b) => ((b as number) || 0) - ((a as number) || 0));

    return (
        <div className="space-y-6">
            {/* Success Message */}
            {successMessage && (
                <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-lg text-success">
                    <CheckCircle className="w-5 h-5" />
                    <p>{successMessage}</p>
                </div>
            )}

            {/* Error Message */}
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
                    <h1 className="text-2xl font-bold text-text-primary">Students</h1>
                    <p className="text-text-secondary mt-1">Manage student registrations</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent-teal to-primary text-white font-semibold rounded-lg shadow-glow-blue hover:-translate-y-0.5 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Register Student
                </button>
            </div>

            {/* Search & Filters */}
            <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search by name, roll number, or email..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <select
                                value={filterBatch}
                                onChange={(e) => {
                                    setFilterBatch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-primary"
                            >
                                <option value="">All Years</option>
                                {admissionYears.map((year) => (
                                    <option key={year} value={year ?? ''}>
                                        {year}
                                    </option>
                                ))}
                                {batches.map((batch) => (
                                    <option key={batch.id} value={batch.batch_year}>
                                        {batch.batch_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => {
                                setFilterStatus(e.target.value as 'all' | 'active' | 'inactive');
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-primary"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left p-4 text-text-secondary font-medium text-sm">Roll Number</th>
                                <th className="text-left p-4 text-text-secondary font-medium text-sm">Name</th>
                                <th className="text-left p-4 text-text-secondary font-medium text-sm hidden md:table-cell">Email</th>
                                <th className="text-left p-4 text-text-secondary font-medium text-sm hidden lg:table-cell">Department</th>
                                <th className="text-left p-4 text-text-secondary font-medium text-sm hidden lg:table-cell">Year</th>
                                <th className="text-left p-4 text-text-secondary font-medium text-sm">Status</th>
                                <th className="text-right p-4 text-text-secondary font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="border-b border-white/5">
                                        {[...Array(7)].map((_, j) => (
                                            <td key={j} className="p-4">
                                                <div className="h-4 bg-white/5 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center">
                                        <GraduationCap className="w-12 h-12 text-text-muted mx-auto mb-3" />
                                        <p className="text-text-secondary">No students found</p>
                                        <p className="text-text-muted text-sm mt-1">Register a student to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <span className="font-mono text-sm text-accent-teal">{student.roll_number}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-accent-teal/20 flex items-center justify-center">
                                                    <span className="text-accent-teal text-sm font-semibold">
                                                        {student.full_name.charAt(0)}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-text-primary">{student.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell text-text-secondary">{student.email}</td>
                                        <td className="p-4 hidden lg:table-cell text-text-secondary">
                                            {student.department_name || '-'}
                                        </td>
                                        <td className="p-4 hidden lg:table-cell text-text-secondary">
                                            {student.admission_year || '-'}
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${student.is_active
                                                    ? 'bg-success/20 text-success'
                                                    : 'bg-error/20 text-error'
                                                    }`}
                                            >
                                                {student.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(student)}
                                                    className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(student)}
                                                    className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-white/10">
                        <p className="text-sm text-text-secondary">
                            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm text-text-primary">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-text-primary">
                                {editingStudent ? 'Edit Student' : 'Register Student'}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    resetForm();
                                }}
                                className="p-2 text-text-secondary hover:text-text-primary"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                    Full Name *
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-lg text-text-primary focus:outline-none focus:border-primary ${formErrors.full_name ? 'border-error' : 'border-white/10'
                                            }`}
                                        placeholder="Rahul Singh"
                                    />
                                </div>
                                {formErrors.full_name && (
                                    <p className="text-error text-xs mt-1">{formErrors.full_name}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                    Email *
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-lg text-text-primary focus:outline-none focus:border-primary ${formErrors.email ? 'border-error' : 'border-white/10'
                                            }`}
                                        placeholder="rahul.singh@college.edu"
                                        disabled={!!editingStudent}
                                    />
                                </div>
                                {formErrors.email && (
                                    <p className="text-error text-xs mt-1">{formErrors.email}</p>
                                )}
                            </div>

                            {/* Phone & Roll Number */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Phone
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                            placeholder="+91 9876543210"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Roll Number *
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="text"
                                            value={formData.roll_number}
                                            onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-lg text-text-primary focus:outline-none focus:border-primary ${formErrors.roll_number ? 'border-error' : 'border-white/10'
                                                }`}
                                            placeholder="2024CS001"
                                            disabled={!!editingStudent}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Password - Only show when creating new student */}
                            {!editingStudent && (
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Password <span className="text-text-muted">(Leave empty for default: Student@RollNo)</span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                            placeholder="Minimum 6 characters"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Enrollment & Admission Year */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Enrollment Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.enrollment_number}
                                        onChange={(e) => setFormData({ ...formData, enrollment_number: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                        placeholder="EN2024001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Admission Year *
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="number"
                                            value={formData.admission_year}
                                            onChange={(e) => setFormData({ ...formData, admission_year: e.target.value })}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-lg text-text-primary focus:outline-none focus:border-primary ${formErrors.admission_year ? 'border-error' : 'border-white/10'
                                                }`}
                                            placeholder="2024"
                                            min="2000"
                                            max="2100"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Gender & DOB */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Gender
                                    </label>
                                    <select
                                        value={formData.gender}
                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary appearance-none"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Date of Birth
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date_of_birth}
                                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-4 py-2.5 border border-white/10 text-text-secondary rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saveMutation.isPending}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-accent-teal to-primary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingStudent ? 'Update' : 'Register Student'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
