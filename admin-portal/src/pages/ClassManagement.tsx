// ============================================
// Admin Portal - Class Management Page
// ============================================

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    ChevronRight,
    ArrowLeft,
    Users,
    BookOpen,
    Clock,
    UserCheck,
    Crown,
    Plus,
    X,
    Loader2,
    AlertCircle,
    CheckCircle,
    Edit,
    Trash2,
    Search,
    GraduationCap,
    ArrowRightLeft,
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

interface ClassInfo {
    id: string;
    class_label: string;
    batch_id: string;
    batch_name: string;
    batch_year?: number;
    branch_id: string;
    branch_name: string;
    branch_code: string;
    course_id?: string;
    course_name?: string;
    course_code?: string;
    current_strength: number;
    class_teacher_id?: string;
    class_incharge_name?: string;
    class_representative_id?: string;
    class_representative_name?: string;
    is_active: boolean;
}

interface Student {
    id: string;
    roll_number: string;
    full_name: string;
    email: string;
    is_active: boolean;
}

// ============================================
// Tab Components
// ============================================

// Students Tab with Transfer/Edit/Delete functionality
function StudentsTab({ classId, className: _className }: { classId: string; className: string }) {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [transferStudent, setTransferStudent] = useState<Student | null>(null);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [editForm, setEditForm] = useState({
        full_name: '',
        phone: '',
        enrollment_number: '',
        admission_year: '',
        gender: '',
        date_of_birth: '',
    });
    const [selectedClass, setSelectedClass] = useState('');
    const [transferReason, setTransferReason] = useState('');

    // Fetch students in this class
    const { data: students = [], isLoading: loading } = useQuery({
        queryKey: ['classStudents', classId],
        queryFn: async () => {
            const response = await fetch(`http://localhost:4003/api/admin/v1/academic/classes/${classId}/students`);
            if (!response.ok) throw new Error('Failed to fetch students');
            const result = await response.json();
            return result.data || [];
        },
        enabled: !!classId,
    });

    // Fetch all students when add modal opens
    const { data: allStudents = [] } = useQuery({
        queryKey: ['allStudents'],
        queryFn: async () => {
            const response = await fetch('http://localhost:4003/api/admin/v1/students');
            if (!response.ok) throw new Error('Failed to fetch all students');
            const result = await response.json();
            return result.data || [];
        },
        enabled: isAddModalOpen,
    });

    // Fetch all classes when transfer modal opens
    const { data: allClasses = [] } = useQuery({
        queryKey: ['allClasses'],
        queryFn: async () => {
            const response = await fetch('http://localhost:4003/api/admin/v1/academic/classes');
            if (!response.ok) throw new Error('Failed to fetch classes');
            const result = await response.json();
            return (result.data || []).filter((c: any) => c.id !== classId);
        },
        enabled: isTransferModalOpen,
    });

    const addStudentMutation = useMutation({
        mutationFn: async () => {
            if (!selectedStudent) throw new Error('No student selected');
            const response = await fetch(`http://localhost:4003/api/admin/v1/academic/classes/${classId}/students`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id: selectedStudent }),
            });
            if (!response.ok) throw new Error('Failed to add student');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classStudents', classId] });
            setIsAddModalOpen(false);
            setSelectedStudent('');
        }
    });

    const handleAddStudent = () => {
        addStudentMutation.mutate();
    };

    const transferStudentMutation = useMutation({
        mutationFn: async () => {
            if (!transferStudent || !selectedClass) throw new Error('Missing data');
            const response = await fetch(`http://localhost:4003/api/admin/v1/academic/students/${transferStudent.id}/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from_class_id: classId,
                    to_class_id: selectedClass,
                    reason: transferReason || null,
                }),
            });
            if (!response.ok) throw new Error('Failed to transfer student');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classStudents', classId] });
            setIsTransferModalOpen(false);
            setTransferStudent(null);
            setSelectedClass('');
            setTransferReason('');
        }
    });

    const handleTransferStudent = () => {
        transferStudentMutation.mutate();
    };

    const removeStudentMutation = useMutation({
        mutationFn: async (student: Student) => {
            const response = await fetch(`http://localhost:4003/api/admin/v1/academic/classes/${classId}/students/${student.id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to remove student');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classStudents', classId] });
        }
    });

    const handleRemoveStudent = async (student: Student) => {
        if (!confirm(`Remove ${student.full_name} from this class?`)) return;
        removeStudentMutation.mutate(student);
    };

    const openTransferModal = (student: Student) => {
        setTransferStudent(student);
        setSelectedClass('');
        setTransferReason('');
        setIsTransferModalOpen(true);
    };

    const openEditModal = async (student: Student) => {
        setEditingStudent(student);
        // Fetch full student details
        try {
            const response = await fetch(`http://localhost:4003/api/admin/v1/students/${student.id}`);
            if (response.ok) {
                const result = await response.json();
                const data = result.data;
                setEditForm({
                    full_name: data.full_name || student.full_name,
                    phone: data.phone || '',
                    enrollment_number: data.enrollment_number || '',
                    admission_year: data.admission_year?.toString() || '',
                    gender: data.gender || '',
                    date_of_birth: data.date_of_birth || '',
                });
            } else {
                setEditForm({
                    full_name: student.full_name,
                    phone: '',
                    enrollment_number: '',
                    admission_year: '',
                    gender: '',
                    date_of_birth: '',
                });
            }
        } catch {
            setEditForm({
                full_name: student.full_name,
                phone: '',
                enrollment_number: '',
                admission_year: '',
                gender: '',
                date_of_birth: '',
            });
        }
        setIsEditModalOpen(true);
    };

    const editStudentMutation = useMutation({
        mutationFn: async () => {
            if (!editingStudent) throw new Error('No student editing');
            const response = await fetch(`http://localhost:4003/api/admin/v1/students/${editingStudent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: editForm.full_name,
                    phone: editForm.phone || null,
                    enrollment_number: editForm.enrollment_number || null,
                    admission_year: editForm.admission_year ? parseInt(editForm.admission_year) : null,
                    gender: editForm.gender || null,
                    date_of_birth: editForm.date_of_birth || null,
                }),
            });
            if (!response.ok) throw new Error('Failed to update student');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classStudents', classId] });
            setIsEditModalOpen(false);
            setEditingStudent(null);
        }
    });

    const handleEditStudent = () => {
        editStudentMutation.mutate();
    };

    const filteredStudents = students.filter(
        (s: Student) =>
            s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                    />
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent-teal to-primary text-white font-semibold rounded-lg"
                >
                    <Plus className="w-4 h-4" />
                    Add Student
                </button>
            </div>

            <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left p-4 text-text-secondary font-medium text-sm">Roll No.</th>
                            <th className="text-left p-4 text-text-secondary font-medium text-sm">Name</th>
                            <th className="text-left p-4 text-text-secondary font-medium text-sm hidden md:table-cell">Email</th>
                            <th className="text-left p-4 text-text-secondary font-medium text-sm">Status</th>
                            <th className="text-right p-4 text-text-secondary font-medium text-sm">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-white/5">
                                    {[...Array(5)].map((_, j) => (
                                        <td key={j} className="p-4">
                                            <div className="h-4 bg-white/5 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center">
                                    <GraduationCap className="w-12 h-12 text-text-muted mx-auto mb-3" />
                                    <p className="text-text-secondary">No students found</p>
                                </td>
                            </tr>
                        ) : (
                            filteredStudents.map((student: Student) => (
                                <tr key={student.id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="p-4 font-mono text-sm text-accent-teal">{student.roll_number}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                <span className="text-primary text-sm font-semibold">{student.full_name.charAt(0)}</span>
                                            </div>
                                            <span className="font-medium text-text-primary">{student.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 hidden md:table-cell text-text-secondary">{student.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.is_active ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                                            {student.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(student)}
                                                className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg"
                                                title="Edit student"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openTransferModal(student)}
                                                className="p-2 text-text-secondary hover:text-secondary hover:bg-secondary/10 rounded-lg"
                                                title="Transfer to another class"
                                            >
                                                <ArrowRightLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveStudent(student)}
                                                className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg"
                                                title="Remove from class"
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

            {/* Add Student Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-text-primary">Add Student to Class</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Select Student</label>
                                <select
                                    value={selectedStudent}
                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                >
                                    <option value="">Select a student...</option>
                                    {allStudents.map((s: Student) => (
                                        <option key={s.id} value={s.id}>{s.roll_number} - {s.full_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-white/10 text-text-secondary rounded-lg hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddStudent}
                                    disabled={addStudentMutation.isPending || !selectedStudent}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-accent-teal to-primary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {addStudentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Add Student
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Student Modal */}
            {isTransferModalOpen && transferStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div>
                                <h2 className="text-xl font-bold text-text-primary">Transfer Student</h2>
                                <p className="text-sm text-text-secondary mt-1">
                                    {transferStudent.full_name} ({transferStudent.roll_number})
                                </p>
                            </div>
                            <button onClick={() => setIsTransferModalOpen(false)} className="p-2 text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Transfer to Class *</label>
                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                >
                                    <option value="">Select a class...</option>
                                    {allClasses.map((c: any) => (
                                        <option key={c.id} value={c.id}>
                                            {c.class_label} - {c.branches?.branch_name || ''} ({c.batches?.batch_year || ''})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Reason (optional)</label>
                                <textarea
                                    value={transferReason}
                                    onChange={(e) => setTransferReason(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary resize-none"
                                    placeholder="e.g., Section change..."
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsTransferModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-white/10 text-text-secondary rounded-lg hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleTransferStudent}
                                    disabled={transferStudentMutation.isPending || !selectedClass}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {transferStudentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Transfer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {isEditModalOpen && editingStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-lg my-8">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div>
                                <h2 className="text-xl font-bold text-text-primary">Edit Student</h2>
                                <p className="text-sm text-text-secondary mt-1">
                                    {editingStudent.roll_number} • {editingStudent.email}
                                </p>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Roll Number & Email (Read-only) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Roll Number</label>
                                    <input
                                        type="text"
                                        value={editingStudent.roll_number}
                                        disabled
                                        className="w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg text-text-muted cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={editingStudent.email}
                                        disabled
                                        className="w-full px-4 py-2.5 bg-white/10 border border-white/10 rounded-lg text-text-muted cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            {/* Full Name */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                    placeholder="Student name"
                                />
                            </div>

                            {/* Phone & Enrollment Number */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                        placeholder="+91 9876543210"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Enrollment Number</label>
                                    <input
                                        type="text"
                                        value={editForm.enrollment_number}
                                        onChange={(e) => setEditForm({ ...editForm, enrollment_number: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                        placeholder="EN2024001"
                                    />
                                </div>
                            </div>

                            {/* Admission Year & Gender */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Admission Year</label>
                                    <input
                                        type="number"
                                        value={editForm.admission_year}
                                        onChange={(e) => setEditForm({ ...editForm, admission_year: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                        placeholder="2024"
                                        min="2000"
                                        max="2100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary mb-1">Gender</label>
                                    <select
                                        value={editForm.gender}
                                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    value={editForm.date_of_birth}
                                    onChange={(e) => setEditForm({ ...editForm, date_of_birth: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-white/10 text-text-secondary rounded-lg hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleEditStudent}
                                    disabled={editStudentMutation.isPending || !editForm.full_name.trim()}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-accent-teal to-primary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {editStudentMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Subjects Tab with Professor Assignment
function SubjectsTab({ classId, semester }: { classId: string; semester: number }) {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProfessorModalOpen, setIsProfessorModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedClassSubject, setSelectedClassSubject] = useState<any>(null);
    const [selectedProfessor, setSelectedProfessor] = useState('');

    // Fetch class subjects
    const { data: subjects = [], isLoading: loading } = useQuery({
        queryKey: ['classSubjects', classId, semester],
        queryFn: async () => {
            const response = await fetch(`http://localhost:4003/api/admin/v1/academic/classes/${classId}/subjects`);
            if (!response.ok) throw new Error('Failed to fetch subjects');
            const result = await response.json();
            return result.data || [];
        },
        enabled: !!classId && !!semester,
    });

    // Fetch all subjects when add modal opens
    const { data: allSubjects = [] } = useQuery({
        queryKey: ['allSubjects'],
        queryFn: async () => {
            const response = await fetch('http://localhost:4003/api/admin/v1/academic/subjects');
            if (!response.ok) throw new Error('Failed to fetch all subjects');
            const result = await response.json();
            return result.data || [];
        },
        enabled: isAddModalOpen,
    });

    // Fetch all professors when professor modal opens
    const { data: allProfessors = [] } = useQuery({
        queryKey: ['allProfessors'],
        queryFn: async () => {
            const response = await fetch('http://localhost:4003/api/admin/v1/professors');
            if (!response.ok) throw new Error('Failed to fetch professors');
            const result = await response.json();
            return result.data || [];
        },
        enabled: isProfessorModalOpen,
    });

    const assignSubjectMutation = useMutation({
        mutationFn: async () => {
            if (!selectedSubject) throw new Error('Missing subject');
            const response = await fetch(`http://localhost:4003/api/admin/v1/academic/classes/${classId}/subjects`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject_id: selectedSubject }),
            });
            if (!response.ok) throw new Error('Failed to assign subject');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classSubjects', classId, semester] });
            setIsAddModalOpen(false);
            setSelectedSubject('');
        }
    });

    const handleAssignSubject = () => {
        assignSubjectMutation.mutate();
    };

    const assignProfessorMutation = useMutation({
        mutationFn: async () => {
            if (!selectedClassSubject) throw new Error('Missing class subject');
            const response = await fetch(`http://localhost:4003/api/admin/v1/academic/classes/${classId}/subjects/${selectedClassSubject.subject_id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ professor_id: selectedProfessor || null }),
            });
            if (!response.ok) throw new Error('Failed to assign professor');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classSubjects', classId, semester] });
            setIsProfessorModalOpen(false);
            setSelectedClassSubject(null);
            setSelectedProfessor('');
        }
    });

    const handleAssignProfessor = () => {
        assignProfessorMutation.mutate();
    };

    const openProfessorModal = (subject: any) => {
        setSelectedClassSubject(subject);
        setSelectedProfessor(subject.professor_id || '');
        setIsProfessorModalOpen(true);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-text-secondary">
                    Semester {semester} • {subjects.length} subjects • {subjects.reduce((acc: number, s: any) => acc + (s.credits || 0), 0)} credits
                </p>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg"
                >
                    <Plus className="w-4 h-4" />
                    Add Subject
                </button>
            </div>

            {/* Subjects Table */}
            <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    </div>
                ) : subjects.length === 0 ? (
                    <div className="p-12 text-center">
                        <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-text-primary mb-2">No Subjects Assigned</h3>
                        <p className="text-text-secondary mb-4">Add subjects to this class and assign professors</p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Add Subject
                        </button>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left p-4 text-text-secondary font-medium text-sm">Code</th>
                                <th className="text-left p-4 text-text-secondary font-medium text-sm">Subject Name</th>
                                <th className="text-left p-4 text-text-secondary font-medium text-sm hidden md:table-cell">Type</th>
                                <th className="text-left p-4 text-text-secondary font-medium text-sm">Credits</th>
                                <th className="text-left p-4 text-text-secondary font-medium text-sm">Professor</th>
                                <th className="text-right p-4 text-text-secondary font-medium text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.map((subject: any) => (
                                <tr key={subject.id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="p-4 font-mono text-sm text-primary">{subject.subject_code}</td>
                                    <td className="p-4">
                                        <span className="font-medium text-text-primary">{subject.subject_name}</span>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <span className={`text-xs px-2 py-1 rounded-full ${subject.subject_type === 'theory' ? 'bg-primary/20 text-primary' :
                                            subject.subject_type === 'lab' ? 'bg-accent-teal/20 text-accent-teal' :
                                                'bg-secondary/20 text-secondary'
                                            }`}>
                                            {subject.subject_type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-text-secondary">{subject.credits}</td>
                                    <td className="p-4">
                                        {subject.professor_name && subject.professor_name !== 'Not assigned' ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                                                    <span className="text-secondary text-sm font-semibold">
                                                        {subject.professor_name.charAt(0)}
                                                    </span>
                                                </div>
                                                <span className="text-text-primary">{subject.professor_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-text-muted italic">Not assigned</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openProfessorModal(subject)}
                                                className="px-3 py-1.5 text-sm bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors"
                                            >
                                                {subject.professor_id ? 'Change' : 'Assign'} Professor
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Subject Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold text-text-primary">Add Subject to Class</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Select Subject</label>
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                >
                                    <option value="">Select a subject...</option>
                                    {allSubjects.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>
                                    ))}
                                </select>
                            </div>
                            {allSubjects.length === 0 && (
                                <p className="text-sm text-warning">No subjects available. Create subjects first from the Subjects page.</p>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-white/10 text-text-secondary rounded-lg hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignSubject}
                                    disabled={assignSubjectMutation.isPending || !selectedSubject}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {assignSubjectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Add Subject
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Professor Modal */}
            {isProfessorModalOpen && selectedClassSubject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary border border-white/10 rounded-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <div>
                                <h2 className="text-xl font-bold text-text-primary">Assign Professor</h2>
                                <p className="text-sm text-text-secondary mt-1">
                                    {selectedClassSubject.subject_code} - {selectedClassSubject.subject_name}
                                </p>
                            </div>
                            <button onClick={() => setIsProfessorModalOpen(false)} className="p-2 text-text-secondary hover:text-text-primary">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">Select Professor</label>
                                <select
                                    value={selectedProfessor}
                                    onChange={(e) => setSelectedProfessor(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                                >
                                    <option value="">No professor (unassign)</option>
                                    {allProfessors.map((p: any) => (
                                        <option key={p.id} value={p.id}>
                                            {p.full_name} - {p.designation || 'Professor'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsProfessorModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-white/10 text-text-secondary rounded-lg hover:bg-white/5"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignProfessor}
                                    disabled={assignProfessorMutation.isPending}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {assignProfessorMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {selectedProfessor ? 'Assign Professor' : 'Remove Assignment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Timetable Tab with Drag & Drop
function TimetableTab({ classId }: { classId: string }) {
    const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4003/api/admin/v1';

    const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const DAY_LABELS: Record<string, string> = {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday'
    };

    const PERIODS = [
        { number: 1, start: '09:00', end: '10:00' },
        { number: 2, start: '10:00', end: '11:00' },
        { number: 3, start: '11:00', end: '12:00' },
        { number: 4, start: '12:00', end: '13:00' },
        { number: 'lunch', start: '13:00', end: '13:30', isBreak: true },
        { number: 5, start: '13:30', end: '14:30' },
        { number: 6, start: '14:30', end: '15:30' },
        { number: 7, start: '15:30', end: '16:30' },
        { number: 8, start: '16:30', end: '17:30' },
    ];

    interface ClassSubject {
        id: string;
        subject_id: string;
        subjects: { name: string; code: string };
        professor_profiles: { id: string; users: { full_name: string } };
    }

    interface TimetableSlot {
        id?: string;
        class_subject_id: string;
        day_of_week: string;
        period_number: number;
        start_time: string;
        end_time: string;
        room_number?: string;
        slot_type: string;
        class_subjects?: ClassSubject;
    }

    const queryClient = useQueryClient();
    const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
    const [draggedSubject, setDraggedSubject] = useState<ClassSubject | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const { data: classSubjects = [] } = useQuery({
        queryKey: ['classSubjectsTimetable', classId],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/timetables/class/${classId}/subjects`);
            if (!res.ok) throw new Error('Failed to fetch class subjects');
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        },
        enabled: !!classId,
    });

    const { data: fetchedTimetable, isLoading: loading } = useQuery({
        queryKey: ['timetable', classId],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/timetables/class/${classId}`);
            if (!res.ok) throw new Error('Failed to fetch timetable');
            const data = await res.json();
            return data;
        },
        enabled: !!classId,
    });

    useEffect(() => {
        if (fetchedTimetable) {
            setTimetableSlots(Array.isArray(fetchedTimetable.slots) ? fetchedTimetable.slots : []);
        }
    }, [fetchedTimetable]);

    const handleDragStart = (subject: ClassSubject) => {
        setDraggedSubject(subject);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (day: string, period: number) => {
        if (!draggedSubject) return;

        const periodInfo = PERIODS.find(p => p.number === period);
        if (!periodInfo) return;

        const existingSlot = timetableSlots.find(
            s => s.day_of_week === day && s.period_number === period
        );

        if (existingSlot) {
            setTimetableSlots(prev =>
                prev.map(s =>
                    s.day_of_week === day && s.period_number === period
                        ? { ...s, class_subject_id: draggedSubject.id, class_subjects: draggedSubject }
                        : s
                )
            );
        } else {
            const newSlot: TimetableSlot = {
                class_subject_id: draggedSubject.id,
                day_of_week: day,
                period_number: period,
                start_time: periodInfo.start,
                end_time: periodInfo.end,
                slot_type: 'regular',
                class_subjects: draggedSubject
            };
            setTimetableSlots(prev => [...prev, newSlot]);
        }

        setDraggedSubject(null);
    };

    const handleRemoveSlot = (day: string, period: number) => {
        setTimetableSlots(prev =>
            prev.filter(s => !(s.day_of_week === day && s.period_number === period))
        );
    };

    const saveTimetableMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API_BASE}/timetables/class/${classId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slots: timetableSlots.map(s => ({
                        class_subject_id: s.class_subject_id,
                        day_of_week: s.day_of_week,
                        period_number: s.period_number,
                        start_time: s.start_time,
                        end_time: s.end_time,
                        room_number: s.room_number,
                        slot_type: s.slot_type
                    })),
                    effectiveFrom: new Date().toISOString().split('T')[0],
                    effectiveTo: null
                })
            });

            if (!res.ok) throw new Error('Failed to save timetable');
        },
        onSuccess: () => {
            setMessage({ type: 'success', text: 'Timetable saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
            queryClient.invalidateQueries({ queryKey: ['timetable', classId] });
        },
        onError: () => {
            setMessage({ type: 'error', text: 'Failed to save timetable' });
            setTimeout(() => setMessage(null), 3000);
        }
    });

    const handleSaveTimetable = () => {
        saveTimetableMutation.mutate();
    };

    const getSlot = (day: string, period: number) => {
        return timetableSlots.find(s => s.day_of_week === day && s.period_number === period);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-secondary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Timetable Grid */}
                <div className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-text-secondary">Drag subjects from the panel to create timetable</p>
                        <button
                            onClick={handleSaveTimetable}
                            disabled={saveTimetableMutation.isPending || timetableSlots.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-orange to-secondary text-white font-semibold rounded-lg disabled:opacity-50"
                        >
                            <CheckCircle className="w-4 h-4" />
                            {saveTimetableMutation.isPending ? 'Saving...' : 'Save Timetable'}
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="border border-white/10 p-2 bg-bg-secondary text-text-secondary text-sm font-medium sticky left-0 z-10">
                                        Day / Time
                                    </th>
                                    {PERIODS.map(period => (
                                        <th key={period.number} className="border border-white/10 p-2 bg-bg-secondary text-text-primary text-sm font-medium min-w-[150px]">
                                            {period.isBreak ? (
                                                <div>
                                                    <div className="font-semibold text-warning">Lunch Break</div>
                                                    <div className="text-xs text-text-muted flex items-center justify-center gap-1 mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        {period.start} - {period.end}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="font-semibold">Period {period.number}</div>
                                                    <div className="text-xs text-text-muted flex items-center justify-center gap-1 mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        {period.start} - {period.end}
                                                    </div>
                                                </div>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {DAYS.map(day => (
                                    <tr key={day}>
                                        <td className="border border-white/10 p-3 bg-bg-secondary text-center sticky left-0 z-10">
                                            <div className="text-sm font-medium text-text-primary">{DAY_LABELS[day]}</div>
                                        </td>
                                        {PERIODS.map(period => {
                                            if (period.isBreak) {
                                                return (
                                                    <td key={`${day}-${period.number}`} className="border border-white/10 p-2 bg-warning/5">
                                                        <div className="h-20 flex items-center justify-center text-text-muted text-xs">
                                                            Lunch
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            const slot = getSlot(day, period.number as number);
                                            return (
                                                <td
                                                    key={`${day}-${period.number}`}
                                                    className="border border-white/10 p-2 h-20"
                                                    onDragOver={handleDragOver}
                                                    onDrop={() => handleDrop(day, period.number as number)}
                                                >
                                                    {slot ? (
                                                        <div className="bg-primary/10 border border-primary/30 rounded p-2 relative group h-full">
                                                            <button
                                                                onClick={() => handleRemoveSlot(day, period.number as number)}
                                                                className="absolute -top-2 -right-2 w-5 h-5 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                            <div className="text-sm font-semibold text-primary">
                                                                {slot.class_subjects?.subjects.code}
                                                            </div>
                                                            <div className="text-xs text-text-primary mt-1 font-medium">
                                                                {slot.class_subjects?.subjects.name}
                                                            </div>
                                                            <div className="text-xs text-text-secondary mt-1">
                                                                👨‍🏫 {slot.class_subjects?.professor_profiles?.users?.full_name}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-text-muted text-xs border border-dashed border-white/10 rounded hover:border-primary/50 hover:bg-primary/5 transition-colors">
                                                            Drop here
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Subject Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-4 sticky top-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Class Subjects</h3>
                        {classSubjects.length === 0 ? (
                            <p className="text-text-muted text-sm">No subjects assigned to this class</p>
                        ) : (
                            <div className="space-y-2">
                                {classSubjects.map(subject => (
                                    <div
                                        key={subject.id}
                                        draggable
                                        onDragStart={() => handleDragStart(subject)}
                                        className="p-3 bg-bg-tertiary border border-white/10 rounded-lg cursor-move hover:border-primary transition-colors"
                                    >
                                        <div className="text-sm font-medium text-text-primary">
                                            {subject.subjects.name}
                                        </div>
                                        <div className="text-xs text-text-secondary mt-1">
                                            {subject.subjects.code}
                                        </div>
                                        <div className="text-xs text-text-muted mt-1">
                                            👨‍🏫 {subject.professor_profiles?.users?.full_name || 'Not assigned'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Class Representative Tab
function CRTab({ classId, currentCR }: { classId: string; currentCR?: { id: string; name: string } }) {
    const [selectedStudent, setSelectedStudent] = useState<string>(currentCR?.id || '');

    const { data: students = [] } = useQuery({
        queryKey: ['classStudents', classId],
        queryFn: async () => {
            const response = await fetch(`http://localhost:4003/api/admin/v1/academic/classes/${classId}/students`);
            if (!response.ok) throw new Error('Failed to fetch students');
            const result = await response.json();
            return result.data || [];
        }
    });

    const updateCRMutation = useMutation({
        mutationFn: async () => {
            if (!selectedStudent) throw new Error('No student selected');
            const response = await fetch(`http://localhost:4003/api/admin/v1/academic/classes/${classId}/representatives`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: selectedStudent,
                    representative_type: 'CR'
                })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update CR');
            }
        },
        onSuccess: () => {
            alert('CR updated successfully!');
            window.location.reload();
        },
        onError: (error: Error) => {
            alert(`Error: ${error.message}`);
        }
    });

    const handleSave = () => {
        updateCRMutation.mutate();
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-accent-orange/20 flex items-center justify-center">
                        <Crown className="w-8 h-8 text-accent-orange" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary">Class Representative</h3>
                        <p className="text-text-secondary">Select a student to be the CR for this class</p>
                    </div>
                </div>

                {currentCR && (
                    <div className="mb-6 p-4 bg-accent-orange/10 border border-accent-orange/30 rounded-lg">
                        <p className="text-sm text-text-muted">Current CR</p>
                        <p className="text-lg font-semibold text-accent-orange">{currentCR.name}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-text-secondary">Select New CR</label>
                    <select
                        value={selectedStudent}
                        onChange={(e) => setSelectedStudent(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                    >
                        <option value="">Select a student...</option>
                        {students.map((student: Student) => (
                            <option key={student.id} value={student.id}>
                                {student.roll_number} - {student.full_name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={!selectedStudent || updateCRMutation.isPending}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-accent-orange to-secondary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {updateCRMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Update CR
                    </button>
                    {currentCR && (
                        <button className="px-4 py-2.5 border border-error/50 text-error rounded-lg hover:bg-error/10">
                            Remove CR
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Class In-Charge Tab
function InChargeTab({ classId, currentInCharge }: { classId: string; currentInCharge?: { id: string; name: string } }) {
    const [selectedProfessor, setSelectedProfessor] = useState<string>(currentInCharge?.id || '');

    const { data: professors = [] } = useQuery({
        queryKey: ['allProfessors'],
        queryFn: async () => {
            const response = await fetch('http://localhost:4003/api/admin/v1/professors');
            if (!response.ok) throw new Error('Failed to fetch professors');
            const result = await response.json();
            return result.data || [];
        }
    });

    const updateInChargeMutation = useMutation({
        mutationFn: async () => {
            if (!selectedProfessor) throw new Error('No professor selected');
            const response = await fetch(`http://localhost:4003/api/admin/v1/academic/classes/${classId}/teacher`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    professor_id: selectedProfessor
                })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update In-Charge');
            }
        },
        onSuccess: () => {
            alert('Class In-Charge updated successfully!');
            window.location.reload();
        },
        onError: (error: Error) => {
            alert(`Error: ${error.message}`);
        }
    });

    const handleSave = () => {
        updateInChargeMutation.mutate();
    };

    return (
        <div className="max-w-2xl space-y-6">
            <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                        <UserCheck className="w-8 h-8 text-secondary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary">Class In-Charge</h3>
                        <p className="text-text-secondary">Assign a professor as the class coordinator</p>
                    </div>
                </div>

                {currentInCharge && (
                    <div className="mb-6 p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
                        <p className="text-sm text-text-muted">Current In-Charge</p>
                        <p className="text-lg font-semibold text-secondary">{currentInCharge.name}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-text-secondary">Select Professor</label>
                    <select
                        value={selectedProfessor}
                        onChange={(e) => setSelectedProfessor(e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-text-primary focus:outline-none focus:border-primary"
                    >
                        <option value="">Select a professor...</option>
                        {professors.map((prof: any) => (
                            <option key={prof.id} value={prof.id}>
                                {prof.full_name} - {prof.designation}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={!selectedProfessor || updateInChargeMutation.isPending}
                        className="flex-1 px-4 py-2.5 bg-gradient-to-r from-secondary to-primary text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {updateInChargeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Update In-Charge
                    </button>
                    {currentInCharge && (
                        <button className="px-4 py-2.5 border border-error/50 text-error rounded-lg hover:bg-error/10">
                            Remove
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================
// Main Class Management Page
// ============================================

export default function ClassManagement() {
    const { classId } = useParams<{ classId: string }>();
    const navigate = useNavigate();

    const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
    const [activeTab, setActiveTab] = useState<'students' | 'subjects' | 'timetable' | 'cr' | 'incharge'>('students');
    const [loading, setLoading] = useState(true);
    const [successMessage, _setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Tabs configuration
    const tabs = [
        { id: 'students', label: 'Students', icon: Users },
        { id: 'subjects', label: 'Subjects', icon: BookOpen },
        { id: 'timetable', label: 'Timetable', icon: Clock },
        { id: 'cr', label: 'CR', icon: Crown },
        { id: 'incharge', label: 'In-Charge', icon: UserCheck },
    ] as const;

    // Fetch class info
    useEffect(() => {
        const fetchClass = async () => {
            if (!classId) {
                setLoading(false);
                return;
            }

            if (!supabase) {
                // Mock data
                setClassInfo({
                    id: classId,
                    class_label: '2024-CSE-A',
                    batch_id: '1',
                    batch_name: '2024-2028',
                    batch_year: 2024,
                    branch_id: '1',
                    branch_name: 'Computer Science & Engineering',
                    branch_code: 'CSE',
                    course_id: '1',
                    course_name: 'B.Tech',
                    course_code: 'BTECH',
                    current_strength: 60,
                    class_teacher_id: '1',
                    class_incharge_name: 'Dr. John Smith',
                    class_representative_id: '1',
                    class_representative_name: 'Rahul Singh',
                    is_active: true,
                });
                setLoading(false);
                return;
            }

            try {
                // Fetch class with class teacher info
                const { data, error } = await supabase
                    .from('classes')
                    .select(`
                        *,
                        batches(id, batch_name, batch_year),
                        branches(id, branch_name, branch_code, course_id, courses(id, course_name, course_code)),
                        professor_profiles:class_teacher_id(id, users(full_name))
                    `)
                    .eq('id', classId)
                    .single();

                if (error) throw error;

                // Fetch class representative (CR)
                const { data: crData } = await supabase
                    .from('class_representatives')
                    .select(`
                        id,
                        student_id,
                        student_profiles(id, users(full_name))
                    `)
                    .eq('class_id', classId)
                    .eq('representative_type', 'CR')
                    .eq('is_active', true)
                    .single();

                setClassInfo({
                    id: data.id,
                    class_label: data.class_label,
                    batch_id: data.batch_id,
                    batch_name: data.batches?.batch_name || '',
                    batch_year: data.batches?.batch_year,
                    branch_id: data.branch_id,
                    branch_name: data.branches?.branch_name || '',
                    branch_code: data.branches?.branch_code || '',
                    course_id: data.branches?.course_id,
                    course_name: data.branches?.courses?.course_name || '',
                    course_code: data.branches?.courses?.course_code || '',
                    current_strength: data.current_strength || 0,
                    class_teacher_id: data.class_teacher_id,
                    class_incharge_name: (data.professor_profiles as any)?.users?.full_name,
                    class_representative_id: crData?.student_id,
                    class_representative_name: (crData?.student_profiles as any)?.users?.full_name,
                    is_active: data.is_active,
                });
            } catch (error) {
                console.error('Error fetching class:', error);
                setErrorMessage('Failed to load class details');
            } finally {
                setLoading(false);
            }
        };

        fetchClass();
    }, [classId]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-white/5 rounded w-64 animate-pulse" />
                <div className="h-24 bg-white/5 rounded animate-pulse" />
                <div className="h-12 bg-white/5 rounded animate-pulse" />
                <div className="h-96 bg-white/5 rounded animate-pulse" />
            </div>
        );
    }

    if (!classInfo) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-text-primary">Class not found</h2>
                <button onClick={() => navigate('/batches')} className="mt-4 text-primary hover:underline">
                    Go to Batches
                </button>
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
                <Link to={`/batches/${classInfo.batch_id}`} className="text-text-secondary hover:text-primary">
                    {classInfo.batch_name}
                </Link>
                {classInfo.course_id && (
                    <>
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                        <Link to={`/batches/${classInfo.batch_id}/courses/${classInfo.course_id}`} className="text-text-secondary hover:text-primary">
                            {classInfo.course_code || 'Course'}
                        </Link>
                    </>
                )}
                <ChevronRight className="w-4 h-4 text-text-muted" />
                <Link
                    to={`/batches/${classInfo.batch_id}/courses/${classInfo.course_id}/branches/${classInfo.branch_id}/sections`}
                    className="text-text-secondary hover:text-primary"
                >
                    {classInfo.branch_code}
                </Link>
                <ChevronRight className="w-4 h-4 text-text-muted" />
                <span className="text-text-primary font-medium">{classInfo.class_label}</span>
            </nav>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-accent-orange/20 flex items-center justify-center">
                                <span className="text-xl font-bold text-accent-orange">{classInfo.class_label?.split('-').pop() || 'A'}</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-text-primary">{classInfo.class_label}</h1>
                                <p className="text-text-secondary">{classInfo.branch_name} • {classInfo.course_name}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg">
                        <Users className="w-4 h-4 text-text-muted" />
                        <span className="text-sm text-text-secondary">{classInfo.current_strength} Students</span>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-white/10 text-text-secondary rounded-lg hover:bg-white/5">
                        <Edit className="w-4 h-4" />
                        Edit Class
                    </button>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-text-muted">Batch</p>
                    <p className="text-lg font-semibold text-text-primary mt-1">{classInfo.batch_name}</p>
                </div>
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-text-muted">Course</p>
                    <p className="text-lg font-semibold text-text-primary mt-1">{classInfo.course_name || 'N/A'}</p>
                </div>
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-text-muted">Class In-Charge</p>
                    <p className="text-lg font-semibold text-secondary mt-1">{classInfo.class_incharge_name || 'Not assigned'}</p>
                </div>
                <div className="bg-gradient-to-br from-bg-secondary/95 to-bg-tertiary/95 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-text-muted">Class Representative</p>
                    <p className="text-lg font-semibold text-accent-orange mt-1">{classInfo.class_representative_name || 'Not assigned'}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10">
                <div className="flex gap-1 overflow-x-auto pb-px">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'students' && <StudentsTab classId={classId!} className={classInfo.class_label} />}
                {activeTab === 'subjects' && <SubjectsTab classId={classId!} semester={1} />}
                {activeTab === 'timetable' && <TimetableTab classId={classId!} />}
                {activeTab === 'cr' && (
                    <CRTab
                        classId={classId!}
                        currentCR={classInfo.class_representative_id ? { id: classInfo.class_representative_id, name: classInfo.class_representative_name! } : undefined}
                    />
                )}
                {activeTab === 'incharge' && (
                    <InChargeTab
                        classId={classId!}
                        currentInCharge={classInfo.class_teacher_id ? { id: classInfo.class_teacher_id, name: classInfo.class_incharge_name! } : undefined}
                    />
                )}
            </div>
        </div>
    );
}
