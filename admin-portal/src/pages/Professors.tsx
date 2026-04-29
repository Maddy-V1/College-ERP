// ============================================
// Admin Portal - Professors Page
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
    Building2,
    Briefcase,
    Calendar,
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

interface Professor {
    id: string;
    user_id: string;
    employee_id: string;
    full_name: string;
    email: string;
    phone: string | null;
    department_id: string | null;
    department_name: string | null;
    designation: string | null;
    specialization: string | null;
    qualification: string | null;
    joined_date: string | null;
    is_active: boolean;
}

interface Department {
    id: string;
    department_name: string;
    department_code: string;
}

interface ProfessorFormData {
    full_name: string;
    email: string;
    password: string;
    phone: string;
    employee_id: string;
    department_id: string;
    designation: string;
    specialization: string;
    qualification: string;
    joined_date: string;
}

// ============================================
// Professor Management Page
// ============================================

export default function Professors() {
    const queryClient = useQueryClient();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
    const [formData, setFormData] = useState<ProfessorFormData>({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        employee_id: '',
        department_id: '',
        designation: '',
        specialization: '',
        qualification: '',
        joined_date: '',
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch departments
    const { data: filtersData } = useQuery({
        queryKey: ['departments_filters'],
        queryFn: async () => {
            if (!supabase) return { departments: [] };
            const { data } = await supabase
                .from('departments')
                .select('id, department_name, department_code')
                .eq('is_active', true)
                .order('department_name');
            return { departments: (data as Department[]) || [] };
        }
    });

    const departments: Department[] = filtersData?.departments || [];

    // Fetch professors via API
    const { data: professorsData, isLoading: loading } = useQuery({
        queryKey: ['professors', searchQuery, filterDepartment, filterStatus, currentPage, pageSize],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (filterDepartment) params.append('department', filterDepartment);
            if (filterStatus !== 'all') params.append('status', filterStatus);
            params.append('page', currentPage.toString());
            params.append('limit', pageSize.toString());

            const response = await fetch(
                `http://localhost:4003/api/admin/v1/professors?${params.toString()}`
            );

            if (!response.ok) throw new Error('Failed to fetch professors');
            const result = await response.json();

            if (!result.success) throw new Error(result.message || 'Failed to load professors');
            return result;
        }
    });

    const professors: Professor[] = professorsData?.data || [];
    const totalCount = professorsData?.pagination?.total || 0;

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
        if (!formData.employee_id.trim()) {
            errors.employee_id = 'Employee ID is required';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const saveMutation = useMutation({
        mutationFn: async (submitData: any) => {
            const response = await fetch(
                editingProfessor
                    ? `http://localhost:4003/api/admin/v1/professors/${editingProfessor.id}`
                    : 'http://localhost:4003/api/admin/v1/professors',
                {
                    method: editingProfessor ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(submitData),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save professor');
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['professors'] });
            setSuccessMessage(editingProfessor ? 'Professor updated successfully!' : 'Professor added successfully!');
            setIsModalOpen(false);
            resetForm();
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error: Error) => {
            setErrorMessage(error.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (professor: Professor) => {
            const response = await fetch(
                `http://localhost:4003/api/admin/v1/professors/${professor.id}`,
                { method: 'DELETE' }
            );
            if (!response.ok) throw new Error('Failed to delete professor');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['professors'] });
            setSuccessMessage('Professor deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: () => {
            setErrorMessage('Failed to delete professor');
        }
    });

    // Handle form submit
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setErrorMessage('');

        const submitData = editingProfessor
            ? { ...formData, password: undefined } // Remove password from update
            : formData; // Include password for create

        saveMutation.mutate(submitData);
    };

    // Handle delete
    const handleDelete = (professor: Professor) => {
        if (!confirm(`Are you sure you want to delete ${professor.full_name}?`)) return;
        setErrorMessage('');
        deleteMutation.mutate(professor);
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            full_name: '',
            email: '',
            password: '',
            phone: '',
            employee_id: '',
            department_id: '',
            designation: '',
            specialization: '',
            qualification: '',
            joined_date: '',
        });
        setFormErrors({});
        setEditingProfessor(null);
    };

    // Open edit modal
    const openEditModal = (professor: Professor) => {
        setEditingProfessor(professor);
        setFormData({
            full_name: professor.full_name,
            email: professor.email,
            password: '', // Don't prefill password on edit
            phone: professor.phone || '',
            employee_id: professor.employee_id,
            department_id: professor.department_id || '',
            designation: professor.designation || '',
            specialization: professor.specialization || '',
            qualification: professor.qualification || '',
            joined_date: professor.joined_date || '',
        });
        setIsModalOpen(true);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="space-y-6" >
            {/* Success Message */}
            {successMessage && (
                <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-lg text-success">
                    <CheckCircle className="w-5 h-5" />
                    <p>{successMessage}</p>
                </div>
            )}

            {/* Error Message */}
            {
                errorMessage && (
                    <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/30 rounded-lg text-error">
                        <AlertCircle className="w-5 h-5" />
                        <p>{errorMessage}</p>
                        <button onClick={() => setErrorMessage('')} className="ml-auto">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )
            }

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Professors</h1>
                    <p className="text-text-secondary mt-1">Manage faculty members</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg shadow-glow-indigo hover:-translate-y-0.5 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Add Professor
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
                            placeholder="Search by name, email, or employee ID..."
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
                                value={filterDepartment}
                                onChange={(e) => {
                                    setFilterDepartment(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-9 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-primary"
                            >
                                <option value="">All Departments</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.department_name}
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
                                <th className="text-left p-4 text-text-secondary font-medium text-sm">Employee ID</th>
                                <th className="text-left p-4 text-text-secondary font-medium text-sm">Name</th>
                                <th className="text-left p-4 text-text-secondary font-medium text-sm hidden md:table-cell">Email</th>
                                <th className="text-left p-4 text-text-secondary font-medium text-sm hidden lg:table-cell">Department</th>
                                <th className="text-left p-4 text-text-secondary font-medium text-sm hidden lg:table-cell">Designation</th>
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
                            ) : professors.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center">
                                        <User className="w-12 h-12 text-text-muted mx-auto mb-3" />
                                        <p className="text-text-secondary">No professors found</p>
                                        <p className="text-text-muted text-sm mt-1">Add a professor to get started</p>
                                    </td>
                                </tr>
                            ) : (
                                professors.map((professor) => (
                                    <tr key={professor.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="p-4">
                                            <span className="font-mono text-sm text-primary">{professor.employee_id}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                                                    <span className="text-secondary text-sm font-semibold">
                                                        {professor.full_name.charAt(0)}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-text-primary">{professor.full_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 hidden md:table-cell text-text-secondary">{professor.email}</td>
                                        <td className="p-4 hidden lg:table-cell text-text-secondary">
                                            {professor.department_name || '-'}
                                        </td>
                                        <td className="p-4 hidden lg:table-cell text-text-secondary">
                                            {professor.designation || '-'}
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${professor.is_active
                                                    ? 'bg-success/20 text-success'
                                                    : 'bg-error/20 text-error'
                                                    }`}
                                            >
                                                {professor.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(professor)}
                                                    className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(professor)}
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
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <h2 className="text-xl font-bold text-text-primary">
                                    {editingProfessor ? 'Edit Professor' : 'Add Professor'}
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
                                            placeholder="Dr. John Smith"
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
                                            placeholder="john.smith@college.edu"
                                            disabled={!!editingProfessor}
                                        />
                                    </div>
                                    {formErrors.email && (
                                        <p className="text-error text-xs mt-1">{formErrors.email}</p>
                                    )}
                                </div>

                                {/* Phone & Employee ID */}
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
                                            Employee ID *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.employee_id}
                                            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                            className={`w-full px-4 py-2.5 bg-white/5 border rounded-lg text-text-primary focus:outline-none focus:border-primary ${formErrors.employee_id ? 'border-error' : 'border-white/10'
                                                }`}
                                            placeholder="EMP001"
                                            disabled={!!editingProfessor}
                                        />
                                    </div>
                                </div>

                                {/* Password - Only show when creating new professor */}
                                {!editingProfessor && (
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">
                                            Password <span className="text-text-muted">(Leave empty for default: Prof@EmpID)</span>
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

                                {/* Department */}
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Department
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <select
                                            value={formData.department_id}
                                            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary appearance-none"
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.department_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Designation & Qualification */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">
                                            Designation
                                        </label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                            <input
                                                type="text"
                                                value={formData.designation}
                                                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                                placeholder="Professor"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">
                                            Qualification
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.qualification}
                                            onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                            placeholder="Ph.D."
                                        />
                                    </div>
                                </div>

                                {/* Specialization */}
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Specialization
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.specialization}
                                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                        placeholder="Machine Learning, AI"
                                    />
                                </div>

                                {/* Joining Date */}
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Joining Date
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="date"
                                            value={formData.joined_date}
                                            onChange={(e) => setFormData({ ...formData, joined_date: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
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
                                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                        {editingProfessor ? 'Update' : 'Add Professor'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
