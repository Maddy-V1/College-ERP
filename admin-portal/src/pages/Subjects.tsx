// ============================================
// Admin Portal - Subjects Management Page
// ============================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Search,
    BookOpen,
    Edit,
    Trash2,
    X,
    Loader2,
    Filter,
    ChevronDown,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface Subject {
    id: string;
    subject_code: string;
    subject_name: string;
    subject_type: 'theory' | 'lab' | 'elective' | 'open_elective';
    credits: number;
    lecture_hours: number;
    tutorial_hours: number;
    practical_hours: number;
    department_id?: string;
    is_active: boolean;
    created_at: string;
}

interface SubjectFormData {
    subject_code: string;
    subject_name: string;
    subject_type: 'theory' | 'lab' | 'elective' | 'open_elective';
    credits: number;
    lecture_hours: number;
    tutorial_hours: number;
    practical_hours: number;
}

const SUBJECT_TYPES = [
    { value: 'theory', label: 'Theory', color: 'bg-primary/20 text-primary' },
    { value: 'lab', label: 'Lab/Practical', color: 'bg-accent-teal/20 text-accent-teal' },
    { value: 'elective', label: 'Elective', color: 'bg-secondary/20 text-secondary' },
    { value: 'open_elective', label: 'Open Elective', color: 'bg-accent-orange/20 text-accent-orange' },
];

// ============================================
// Main Component
// ============================================

export default function Subjects() {
    const queryClient = useQueryClient();

    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [formData, setFormData] = useState<SubjectFormData>({
        subject_code: '',
        subject_name: '',
        subject_type: 'theory',
        credits: 3,
        lecture_hours: 3,
        tutorial_hours: 1,
        practical_hours: 0,
    });

    // Fetch subjects
    const { data: subjects = [], isLoading: loading } = useQuery<Subject[]>({
        queryKey: ['subjects'],
        queryFn: async () => {
            const response = await fetch('http://localhost:4003/api/admin/v1/academic/subjects');
            if (response.ok) {
                const result = await response.json();
                return result.data || [];
            }
            throw new Error('Failed to fetch subjects');
        }
    });

    // Filter subjects
    const filteredSubjects = subjects.filter((subject) => {
        const matchesSearch =
            subject.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subject.subject_code.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || subject.subject_type === typeFilter;
        return matchesSearch && matchesType;
    });

    // Open modal for create
    const handleCreate = () => {
        setEditingSubject(null);
        setFormData({
            subject_code: '',
            subject_name: '',
            subject_type: 'theory',
            credits: 3,
            lecture_hours: 3,
            tutorial_hours: 1,
            practical_hours: 0,
        });
        setIsModalOpen(true);
    };

    // Open modal for edit
    const handleEdit = (subject: Subject) => {
        setEditingSubject(subject);
        setFormData({
            subject_code: subject.subject_code,
            subject_name: subject.subject_name,
            subject_type: subject.subject_type,
            credits: subject.credits,
            lecture_hours: subject.lecture_hours,
            tutorial_hours: subject.tutorial_hours,
            practical_hours: subject.practical_hours,
        });
        setIsModalOpen(true);
    };

    const saveMutation = useMutation({
        mutationFn: async (submitData: any) => {
            const url = editingSubject
                ? `http://localhost:4003/api/admin/v1/academic/subjects/${editingSubject.id}`
                : 'http://localhost:4003/api/admin/v1/academic/subjects';

            const response = await fetch(url, {
                method: editingSubject ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to save subject');
            }
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            setIsModalOpen(false);
            setSuccessMessage(editingSubject ? 'Subject updated successfully!' : 'Subject created successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error: Error) => {
            setErrorMessage(error.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (subject: Subject) => {
            const response = await fetch(`http://localhost:4003/api/admin/v1/academic/subjects/${subject.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete subject');
            }
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
            setSuccessMessage('Subject deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: (error: Error) => {
            setErrorMessage(error.message);
        }
    });

    // Submit form
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        saveMutation.mutate(formData);
    };

    // Delete subject
    const handleDelete = (subject: Subject) => {
        if (!confirm(`Are you sure you want to delete "${subject.subject_name}"?`)) return;
        setErrorMessage('');
        deleteMutation.mutate(subject);
    };

    const getTypeStyle = (type: string) => {
        const typeConfig = SUBJECT_TYPES.find((t) => t.value === type);
        return typeConfig?.color || 'bg-white/10 text-text-secondary';
    };

    const getTypeLabel = (type: string) => {
        const typeConfig = SUBJECT_TYPES.find((t) => t.value === type);
        return typeConfig?.label || type;
    };

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
                    <h1 className="text-2xl font-bold text-text-primary">Subjects</h1>
                    <p className="text-text-secondary mt-1">Manage all subjects in the curriculum</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg shadow-glow-indigo hover:shadow-lg transition-shadow"
                >
                    <Plus className="w-5 h-5" />
                    Add Subject
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search by subject name or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary appearance-none min-w-[180px]"
                    >
                        <option value="all">All Types</option>
                        {SUBJECT_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-text-muted">Total Subjects</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{subjects.length}</p>
                </div>
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-text-muted">Theory</p>
                    <p className="text-2xl font-bold text-primary mt-1">{subjects.filter((s) => s.subject_type === 'theory').length}</p>
                </div>
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-text-muted">Labs</p>
                    <p className="text-2xl font-bold text-accent-teal mt-1">{subjects.filter((s) => s.subject_type === 'lab').length}</p>
                </div>
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-text-muted">Electives</p>
                    <p className="text-2xl font-bold text-secondary mt-1">{subjects.filter((s) => s.subject_type === 'elective' || s.subject_type === 'open_elective').length}</p>
                </div>
            </div>

            {/* Subjects Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-40 bg-white/5 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filteredSubjects.length === 0 ? (
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-12 text-center">
                    <BookOpen className="w-16 h-16 text-text-muted mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                        {searchQuery || typeFilter !== 'all' ? 'No Subjects Found' : 'No Subjects Yet'}
                    </h3>
                    <p className="text-text-secondary mb-6">
                        {searchQuery || typeFilter !== 'all'
                            ? 'Try adjusting your search or filters'
                            : 'Add your first subject to get started'}
                    </p>
                    {!searchQuery && typeFilter === 'all' && (
                        <button
                            onClick={handleCreate}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Add Subject
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSubjects.map((subject) => (
                        <div
                            key={subject.id}
                            className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-5 hover:border-primary/50 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                                    {subject.subject_code}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${getTypeStyle(subject.subject_type)}`}>
                                    {getTypeLabel(subject.subject_type)}
                                </span>
                            </div>
                            <h3 className="font-semibold text-text-primary mb-2 text-lg">{subject.subject_name}</h3>
                            <div className="flex flex-wrap gap-2 text-xs text-text-muted mb-4">
                                <span className="bg-white/5 px-2 py-1 rounded">{subject.credits} Credits</span>
                                <span className="bg-white/5 px-2 py-1 rounded">L:{subject.lecture_hours}</span>
                                <span className="bg-white/5 px-2 py-1 rounded">T:{subject.tutorial_hours}</span>
                                <span className="bg-white/5 px-2 py-1 rounded">P:{subject.practical_hours}</span>
                            </div>
                            <div className="flex gap-2 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(subject)}
                                    className="flex-1 flex items-center justify-center gap-2 text-sm px-3 py-2 border border-white/10 text-text-secondary rounded-lg hover:bg-white/5 hover:text-primary"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(subject)}
                                    className="flex-1 flex items-center justify-center gap-2 text-sm px-3 py-2 border border-white/10 text-text-secondary rounded-lg hover:bg-error/10 hover:text-error hover:border-error/30"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-bg-secondary">
                            <h2 className="text-xl font-bold text-text-primary">
                                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-text-secondary hover:text-text-primary"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Subject Code *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.subject_code}
                                        onChange={(e) => setFormData({ ...formData, subject_code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., CS201"
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Subject Type *
                                    </label>
                                    <select
                                        value={formData.subject_type}
                                        onChange={(e) => setFormData({ ...formData, subject_type: e.target.value as any })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                    >
                                        {SUBJECT_TYPES.map((type) => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                    Subject Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.subject_name}
                                    onChange={(e) => setFormData({ ...formData, subject_name: e.target.value })}
                                    placeholder="e.g., Data Structures and Algorithms"
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Credits *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.credits}
                                        onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                                        min={1}
                                        max={10}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Lecture Hours
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.lecture_hours}
                                        onChange={(e) => setFormData({ ...formData, lecture_hours: parseInt(e.target.value) || 0 })}
                                        min={0}
                                        max={10}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Tutorial Hours
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.tutorial_hours}
                                        onChange={(e) => setFormData({ ...formData, tutorial_hours: parseInt(e.target.value) || 0 })}
                                        min={0}
                                        max={10}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">
                                        Practical Hours
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.practical_hours}
                                        onChange={(e) => setFormData({ ...formData, practical_hours: parseInt(e.target.value) || 0 })}
                                        min={0}
                                        max={10}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                    />
                                </div>
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
                                    disabled={saveMutation.isPending || !formData.subject_code || !formData.subject_name}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingSubject ? 'Update Subject' : 'Create Subject'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
