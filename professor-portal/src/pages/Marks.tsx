// ============================================
// Professor Portal - Marks Page
// ============================================

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Header, PageContainer, Card, Badge, LoadingSpinner, EmptyState, Button } from '../components/Layout';

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
    branch_code: string;
    student_count: number;
}

interface AssessmentComponent {
    id: string;
    component_name: string;
    max_marks: number;
    weightage: number;
    component_type: string;
}

interface StudentMark {
    student_id: string;
    roll_number: string;
    full_name: string;
    marks_obtained: number | null;
    status: 'saved' | 'pending' | 'editing';
}

// ============================================
// API Configuration
// ============================================
const API_BASE = import.meta.env.VITE_ACADEMIC_API_URL || 'http://localhost:4002/api/academic/v1';

// ============================================
// Class Selection Component
// ============================================
function ClassSelection({
    onSelect
}: {
    onSelect: (cls: AssignedClass) => void
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
            <h2 className="text-lg font-bold text-text-primary mb-4">Select Class & Subject</h2>
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
                        <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </Card>
            ))}
        </div>
    );
}

// ============================================
// Component Management
// ============================================
interface ComponentManagementProps {
    classSubject: AssignedClass;
    onSelectComponent: (component: AssessmentComponent) => void;
    onBack: () => void;
}

function ComponentManagement({ classSubject, onSelectComponent, onBack }: ComponentManagementProps) {
    const [components, setComponents] = useState<AssessmentComponent[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newComponent, setNewComponent] = useState({
        name: '',
        maxMarks: 100,
        weightage: 0,
        type: 'other'
    });
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchComponents();
    }, [classSubject]);

    const fetchComponents = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE}/marks/components/${classSubject.class_subject_id}`
            );
            const data = await response.json();
            if (data.success) {
                setComponents(data.data.components);
            }
        } catch (err) {
            console.error('Error fetching components:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComponent = async () => {
        if (!newComponent.name.trim()) return;

        setAdding(true);
        try {
            const response = await fetch(`${API_BASE}/marks/components`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    class_subject_id: classSubject.class_subject_id,
                    component_name: newComponent.name,
                    max_marks: newComponent.maxMarks,
                    weightage: newComponent.weightage,
                    component_type: newComponent.type,
                }),
            });
            const data = await response.json();

            if (data.success) {
                fetchComponents();
                setShowAddModal(false);
                setNewComponent({ name: '', maxMarks: 100, weightage: 0, type: 'other' });
            }
        } catch (err) {
            console.error('Error adding component:', err);
        } finally {
            setAdding(false);
        }
    };

    const componentTypes = [
        { value: 'minor', label: 'Minor Exam' },
        { value: 'major', label: 'Major Exam' },
        { value: 'assignment', label: 'Assignment' },
        { value: 'quiz', label: 'Quiz' },
        { value: 'practical', label: 'Practical' },
        { value: 'project', label: 'Project' },
        { value: 'other', label: 'Other' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div>
            {/* Class Info */}
            <Card className="mb-4">
                <h3 className="font-semibold text-text-primary">{classSubject.subject_name}</h3>
                <p className="text-sm text-text-secondary">{classSubject.class_label}</p>
            </Card>

            {/* Add Component Button */}
            <Button
                onClick={() => setShowAddModal(true)}
                fullWidth
                className="mb-4"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Assessment Component
            </Button>

            {/* Components List */}
            {components.length === 0 ? (
                <EmptyState
                    icon={
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    }
                    title="No assessment components"
                    description="Add components like Minor 1, Quiz, Assignment to start entering marks."
                />
            ) : (
                <div className="space-y-3">
                    <h3 className="text-sm font-medium text-text-secondary">Assessment Components</h3>
                    {components.map((comp) => (
                        <Card
                            key={comp.id}
                            onClick={() => onSelectComponent(comp)}
                            className="cursor-pointer hover:border-primary/50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-text-primary">{comp.component_name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="info">{comp.max_marks} marks</Badge>
                                        {comp.weightage > 0 && (
                                            <Badge variant="default">{comp.weightage}% weight</Badge>
                                        )}
                                    </div>
                                </div>
                                <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Back Button */}
            <Button variant="secondary" onClick={onBack} fullWidth className="mt-4">
                Back to Class Selection
            </Button>

            {/* Add Component Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-bg-secondary rounded-t-2xl sm:rounded-2xl w-full max-w-sm mx-4 p-6 animate-slide-up">
                        <h3 className="text-lg font-bold text-text-primary mb-4">Add Assessment Component</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-text-secondary mb-1">Component Name</label>
                                <input
                                    type="text"
                                    value={newComponent.name}
                                    onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                                    placeholder="e.g., Minor 1, Quiz 1"
                                    className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-white/10 text-text-primary focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-text-secondary mb-1">Type</label>
                                <select
                                    value={newComponent.type}
                                    onChange={(e) => setNewComponent({ ...newComponent, type: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-white/10 text-text-primary focus:outline-none focus:border-primary"
                                >
                                    {componentTypes.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-text-secondary mb-1">Max Marks</label>
                                    <input
                                        type="number"
                                        value={newComponent.maxMarks}
                                        onChange={(e) => setNewComponent({ ...newComponent, maxMarks: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-white/10 text-text-primary focus:outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-text-secondary mb-1">Weightage %</label>
                                    <input
                                        type="number"
                                        value={newComponent.weightage}
                                        onChange={(e) => setNewComponent({ ...newComponent, weightage: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-white/10 text-text-primary focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <Button variant="secondary" onClick={() => setShowAddModal(false)} className="flex-1">
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleAddComponent} loading={adding} className="flex-1">
                                Add
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// Marks Entry Component
// ============================================
interface MarksEntryProps {
    classSubject: AssignedClass;
    component: AssessmentComponent;
    onBack: () => void;
}

function MarksEntry({ classSubject, component, onBack }: MarksEntryProps) {
    const [students, setStudents] = useState<StudentMark[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchMarks();
    }, [component]);

    const fetchMarks = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/marks/component/${component.id}`);
            const data = await response.json();

            if (data.success) {
                setStudents(data.data.students);
            }
        } catch (err) {
            console.error('Error fetching marks:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMarksChange = (studentId: string, value: string) => {
        const numValue = value === '' ? null : parseFloat(value);

        // Validate
        if (numValue !== null && (numValue < 0 || numValue > component.max_marks)) {
            return;
        }

        setStudents(students.map(s =>
            s.student_id === studentId
                ? { ...s, marks_obtained: numValue, status: 'editing' as const }
                : s
        ));
    };

    const saveMarks = async (studentId: string, marks: number | null) => {
        if (marks === null) return;

        setSaving(prev => new Set(prev).add(studentId));

        try {
            const response = await fetch(`${API_BASE}/marks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    component_id: component.id,
                    student_marks: [{ student_id: studentId, marks_obtained: marks }],
                }),
            });

            const data = await response.json();

            if (data.success) {
                setStudents(students.map(s =>
                    s.student_id === studentId
                        ? { ...s, status: 'saved' as const }
                        : s
                ));
            }
        } catch (err) {
            console.error('Error saving marks:', err);
        } finally {
            setSaving(prev => {
                const next = new Set(prev);
                next.delete(studentId);
                return next;
            });
        }
    };

    const saveAllMarks = async () => {
        const marksToSave = students
            .filter(s => s.marks_obtained !== null && s.status === 'editing')
            .map(s => ({ student_id: s.student_id, marks_obtained: s.marks_obtained }));

        if (marksToSave.length === 0) return;

        setSaving(new Set(marksToSave.map(m => m.student_id)));

        try {
            const response = await fetch(`${API_BASE}/marks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    component_id: component.id,
                    student_marks: marksToSave,
                }),
            });

            const data = await response.json();

            if (data.success) {
                fetchMarks();
            }
        } catch (err) {
            console.error('Error saving marks:', err);
        } finally {
            setSaving(new Set());
        }
    };

    const pendingCount = students.filter(s => s.status === 'pending').length;
    const editingCount = students.filter(s => s.status === 'editing').length;
    const savedCount = students.filter(s => s.status === 'saved').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <Card className="mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-text-primary">{component.component_name}</h3>
                        <p className="text-sm text-text-secondary">{classSubject.subject_name} • {classSubject.class_label}</p>
                    </div>
                    <Badge variant="info">{component.max_marks} marks</Badge>
                </div>
            </Card>

            {/* Stats */}
            <div className="flex items-center gap-2 mb-4 text-xs">
                <Badge variant="success">{savedCount} saved</Badge>
                {editingCount > 0 && <Badge variant="warning">{editingCount} unsaved</Badge>}
                <Badge variant="default">{pendingCount} pending</Badge>
            </div>

            {/* Marks Table */}
            <div className="space-y-2 mb-4">
                {students.map((student) => (
                    <div
                        key={student.student_id}
                        className={`p-3 rounded-lg border transition-colors ${student.status === 'saved'
                                ? 'bg-success/5 border-success/20'
                                : student.status === 'editing'
                                    ? 'bg-warning/5 border-warning/20'
                                    : 'bg-bg-secondary border-white/10'
                            }`}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-text-primary truncate">{student.full_name}</p>
                                <p className="text-xs text-text-secondary">{student.roll_number}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={student.marks_obtained ?? ''}
                                        onChange={(e) => handleMarksChange(student.student_id, e.target.value)}
                                        onBlur={() => saveMarks(student.student_id, student.marks_obtained)}
                                        min={0}
                                        max={component.max_marks}
                                        placeholder="--"
                                        className="w-16 px-2 py-1.5 text-center rounded-lg bg-bg-tertiary border border-white/10 text-text-primary focus:outline-none focus:border-primary"
                                    />
                                    {saving.has(student.student_id) && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-bg-tertiary/80 rounded-lg">
                                            <LoadingSpinner size="sm" />
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-text-muted">/ {component.max_marks}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <Button variant="secondary" onClick={onBack} className="flex-1">
                    Back
                </Button>
                {editingCount > 0 && (
                    <Button
                        variant="primary"
                        onClick={saveAllMarks}
                        loading={saving.size > 0}
                        className="flex-1"
                    >
                        Save All ({editingCount})
                    </Button>
                )}
            </div>
        </div>
    );
}

// ============================================
// Main Marks Component
// ============================================
export default function Marks() {
    const [step, setStep] = useState<'select' | 'components' | 'entry'>('select');
    const [selectedClass, setSelectedClass] = useState<AssignedClass | null>(null);
    const [selectedComponent, setSelectedComponent] = useState<AssessmentComponent | null>(null);

    const handleClassSelect = (cls: AssignedClass) => {
        setSelectedClass(cls);
        setStep('components');
    };

    const handleComponentSelect = (component: AssessmentComponent) => {
        setSelectedComponent(component);
        setStep('entry');
    };

    return (
        <PageContainer
            header={
                <Header
                    title={
                        step === 'select'
                            ? 'Marks Entry'
                            : step === 'components'
                                ? selectedClass?.subject_name || 'Components'
                                : selectedComponent?.component_name || 'Enter Marks'
                    }
                    showBack={step !== 'select'}
                    onBack={() => {
                        if (step === 'entry') {
                            setSelectedComponent(null);
                            setStep('components');
                        } else if (step === 'components') {
                            setSelectedClass(null);
                            setStep('select');
                        }
                    }}
                    showNotification={false}
                />
            }
        >
            {step === 'select' && (
                <ClassSelection onSelect={handleClassSelect} />
            )}

            {step === 'components' && selectedClass && (
                <ComponentManagement
                    classSubject={selectedClass}
                    onSelectComponent={handleComponentSelect}
                    onBack={() => {
                        setSelectedClass(null);
                        setStep('select');
                    }}
                />
            )}

            {step === 'entry' && selectedClass && selectedComponent && (
                <MarksEntry
                    classSubject={selectedClass}
                    component={selectedComponent}
                    onBack={() => {
                        setSelectedComponent(null);
                        setStep('components');
                    }}
                />
            )}
        </PageContainer>
    );
}
