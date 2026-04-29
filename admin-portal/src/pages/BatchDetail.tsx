// ============================================
// Admin Portal - Batch Detail Page
// ============================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Plus,
    ChevronRight,
    GitBranch,
    Loader2,
    Link2,
    BookOpen,
    Users,
    X,
    CheckCircle,
    AlertCircle
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
}

interface Course {
    id: string;
    course_name: string;
    course_code: string;
    duration_years: number;
}

interface Branch {
    id: string;
    branch_name: string;
    branch_code: string;
    course_id: string;
    courses?: Course; // Joined course data
}

interface Class {
    id: string;
    class_label: string; // e.g. "2024-CSE-A"
    branch_id: string;
    student_count?: number;
}

// ============================================
// Batch Detail Page
// ============================================

export default function BatchDetail() {
    const { batchId } = useParams<{ batchId: string }>();
    const navigate = useNavigate();

    // Accordion State: { [courseId]: boolean }
    const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
    // const [allBranches, setAllBranches] = useState<Branch[]>([]);

    // Forms
    const queryClient = useQueryClient();
    const [isLinkCourseModalOpen, setIsLinkCourseModalOpen] = useState(false);
    // const [isLinkBranchModalOpen, setIsLinkBranchModalOpen] = useState(false);
    const [isCreateBranchModalOpen, setIsCreateBranchModalOpen] = useState(false);
    const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);

    // Forms
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [targetBranchId, setTargetBranchId] = useState('');
    const [classLabel, setClassLabel] = useState('');

    const [createBranchData, setCreateBranchData] = useState({
        course_id: '',
        branch_name: '',
        branch_code: ''
    });

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch Data
    const { data, isLoading: loading } = useQuery({
        queryKey: ['batchDetail', batchId],
        queryFn: async () => {
            if (!supabase || !batchId) return {};

            // 1. Fetch Batch
            const { data: batchData, error: batchError } = await supabase
                .from('batches').select('*').eq('id', batchId).single();
            if (batchError) throw batchError;

            // 2. Fetch Linked Courses
            const { data: bcData } = await supabase
                .from('batch_courses')
                .select('course_id, courses(*)')
                .eq('batch_id', batchId)
                .eq('is_active', true);

            const linkedC = (bcData || []).map((item: any) => item.courses).filter((c: any) => !!c) as Course[];

            // Default expand all
            const expanded: Record<string, boolean> = {};
            linkedC.forEach((c: Course) => expanded[c.id] = true);
            setExpandedCourses(expanded);

            // 3. Fetch Linked Branches
            const { data: bbData } = await supabase
                .from('batch_branches')
                .select('branch_id, branches(*, courses(id, course_name, course_code))')
                .eq('batch_id', batchId)
                .eq('is_active', true);

            const linkedB = (bbData || []).map((item: any) => item.branches).filter((b: any) => !!b) as Branch[];

            // Group Branches by Course
            const bByC: Record<string, Branch[]> = {};
            linkedC.forEach((c: Course) => bByC[c.id] = []);
            linkedB.forEach((b: Branch) => {
                if (bByC[b.course_id]) {
                    bByC[b.course_id]!.push(b);
                } else {
                    if (!bByC['orphan']) bByC['orphan'] = [];
                    bByC['orphan']!.push(b);
                }
            });

            // 4. Fetch Classes
            const { data: classesData } = await supabase
                .from('classes')
                .select('*')
                .eq('batch_id', batchId)
                .eq('is_active', true)
                .order('class_label');

            const cByB: Record<string, Class[]> = {};
            linkedB.forEach((b: Branch) => cByB[b.id] = []);
            (classesData || []).forEach((cls: Class) => {
                if (cByB[cls.branch_id]) {
                    cByB[cls.branch_id]?.push(cls);
                }
            });

            // 5. Fetch available data for linking
            const { data: allC } = await supabase.from('courses').select('*').eq('is_active', true).order('course_name');

            return {
                batchData,
                linkedC,
                branchesByCourse: bByC,
                classesByBranch: cByB,
                allC: allC || []
            };
        },
        enabled: !!batchId
    });

    const batch = data?.batchData as Batch | undefined;
    const courses = (data?.linkedC as Course[]) || [];
    const branchesByCourseMap = (data?.branchesByCourse as Record<string, Branch[]>) || {};
    const classesByBranchMap = (data?.classesByBranch as Record<string, Class[]>) || {};
    const allCoursesList = (data?.allC as Course[]) || [];

    // Handlers
    const toggleCourse = (courseId: string) => {
        setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
    };

    const linkCourseMutation = useMutation({
        mutationFn: async () => {
            if (!supabase || !batchId || !selectedCourseId) throw new Error('Missing data');
            const { error } = await supabase.from('batch_courses').insert({ batch_id: batchId, course_id: selectedCourseId });
            if (error && error.code !== '23505') throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['batchDetail', batchId] });
            setSuccessMessage('Course linked!');
            setIsLinkCourseModalOpen(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: () => {
            setErrorMessage('Failed to link course');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    });

    const handleLinkCourse = () => {
        if (!selectedCourseId) return;
        linkCourseMutation.mutate();
    };



    const createBranchMutation = useMutation({
        mutationFn: async () => {
            if (!supabase || !batchId || !createBranchData.course_id || !createBranchData.branch_name) throw new Error('Missing data');
            const { data: newBranch, error: bError } = await supabase.from('branches').insert({
                branch_name: createBranchData.branch_name,
                branch_code: createBranchData.branch_code,
                course_id: createBranchData.course_id,
                is_active: true
            }).select().single();
            if (bError) throw bError;

            await supabase.from('batch_branches').insert({
                batch_id: batchId,
                branch_id: newBranch.id
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['batchDetail', batchId] });
            setSuccessMessage('Branch created & linked!');
            setIsCreateBranchModalOpen(false);
            setCreateBranchData({ course_id: '', branch_name: '', branch_code: '' });
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: () => {
            setErrorMessage('Failed to create branch');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    });

    const handleCreateBranch = () => {
        if (!createBranchData.course_id || !createBranchData.branch_name) return;
        createBranchMutation.mutate();
    };

    const createClassMutation = useMutation({
        mutationFn: async () => {
            if (!supabase || !batchId || !targetBranchId || !classLabel) throw new Error('Missing data');
            const { error } = await supabase.from('classes').insert({
                class_label: classLabel,
                batch_id: batchId,
                branch_id: targetBranchId,
                is_active: true,
                current_strength: 0
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['batchDetail', batchId] });
            setSuccessMessage('Class created!');
            setIsCreateClassModalOpen(false);
            setClassLabel('');
            setTimeout(() => setSuccessMessage(''), 3000);
        },
        onError: () => {
            setErrorMessage('Failed to create class');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    });

    const handleCreateClass = () => {
        if (!targetBranchId || !classLabel) return;
        createClassMutation.mutate();
    };

    // Helpers
    const openCreateClassModal = (branchId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTargetBranchId(branchId);
        // Find branch across all groups
        let branch: Branch | undefined;
        Object.values(branchesByCourseMap).forEach(list => {
            const found = list.find(b => b.id === branchId);
            if (found) branch = found;
        });

        if (branch) {
            const existingCount = (classesByBranchMap[branch.id] || []).length;
            const sectionChar = String.fromCharCode(65 + existingCount); // A, B, C...
            setClassLabel(`${batch?.batch_year || ''}-${branch.branch_code}-${sectionChar}`);
        }
        setIsCreateClassModalOpen(true);
    };

    const getBranchName = (id: string) => {
        for (const list of Object.values(branchesByCourseMap)) {
            const b = list.find(b => b.id === id);
            if (b) return b.branch_name;
        }
        return '';
    }

    if (loading) return <div className="p-12 text-center text-text-secondary"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Loading...</div>;
    if (!batch) return <div className="p-12 text-center">Batch not found</div>;

    return (
        <div className="space-y-8">
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

            {/* Breadcrumb & Header */}
            <div className="space-y-4">
                <nav className="flex items-center gap-2 text-sm text-text-secondary">
                    <Link to="/batches" className="hover:text-primary">Batches</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-text-primary">{batch.batch_name}</span>
                </nav>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-text-primary">{batch.batch_name}</h1>
                        <span className="px-3 py-1 bg-white/5 rounded-full text-secondary text-sm">Year {batch.batch_year}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsLinkCourseModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 text-sm border border-secondary/30 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
                        >
                            <Link2 className="w-4 h-4" />
                            Link Course
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT: COURSES ACCORDION */}
            <div className="space-y-6">
                {courses.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
                        <BookOpen className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-text-primary mb-2">No Courses Linked</h3>
                        <p className="text-text-secondary mb-6">Link a course to start adding branches and classes.</p>
                        <button
                            onClick={() => setIsLinkCourseModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary to-primary text-white rounded-lg"
                        >
                            <Link2 className="w-4 h-4" />
                            Link Course
                        </button>
                    </div>
                ) : (
                    courses.map(course => (
                        <div key={course.id} className="border border-white/10 rounded-xl overflow-hidden bg-bg-secondary/50">
                            {/* Accordion Header */}
                            <div
                                onClick={() => toggleCourse(course.id)}
                                className="flex items-center justify-between p-4 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1 rounded transition-transform duration-200 ${expandedCourses[course.id] ? 'rotate-90' : ''}`}>
                                        <ChevronRight className="w-5 h-5 text-text-muted" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-text-primary">{course.course_name}</h2>
                                        <p className="text-xs text-text-secondary">{course.course_code} • {course.duration_years} Years</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setIsCreateBranchModalOpen(true); setCreateBranchData({ ...createBranchData, course_id: course.id }); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors border border-primary/20"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Add Branch
                                    </button>
                                </div>
                            </div>

                            {/* Accordion Content */}
                            {expandedCourses[course.id] && (
                                <div className="p-4 border-t border-white/10 bg-black/10">
                                    {(!branchesByCourseMap[course.id] || branchesByCourseMap[course.id]?.length === 0) ? (
                                        <div className="text-center py-8 text-text-muted text-sm">
                                            No branches linked to this course in this batch.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            {branchesByCourseMap[course.id]?.map(branch => (
                                                <div key={branch.id} className="bg-bg-tertiary border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                <GitBranch className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-medium text-text-primary">{branch.branch_name}</h3>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => openCreateClassModal(branch.id, e)}
                                                            className="text-xs bg-white/5 hover:bg-white/10 text-text-secondary hover:text-primary border border-white/10 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                            Class
                                                        </button>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {(classesByBranchMap[branch.id] || []).length > 0 ? (
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                {(classesByBranchMap[branch.id] || []).map(cls => (
                                                                    <div
                                                                        key={cls.id}
                                                                        onClick={() => navigate(`/classes/${cls.id}`)}
                                                                        className="bg-black/20 hover:bg-black/40 border border-white/5 rounded p-2 cursor-pointer transition-all flex items-center gap-2 group"
                                                                    >
                                                                        <Users className="w-3 h-3 text-text-muted group-hover:text-primary" />
                                                                        <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary">{cls.class_label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-text-muted italic px-2">No classes yet</div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* MODALS */}
            {/* Link Course Modal */}
            {isLinkCourseModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary w-full max-w-md p-6 rounded-xl border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Link Course</h2>
                            <button onClick={() => setIsLinkCourseModalOpen(false)}><X className="w-5 h-5 text-text-muted" /></button>
                        </div>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg mb-4 text-text-primary"
                        >
                            <option value="">Select Course...</option>
                            {allCoursesList.filter(c => !courses.find(lc => lc.id === c.id)).map(c => (
                                <option key={c.id} value={c.id}>{c.course_name}</option>
                            ))}
                        </select>
                        <button onClick={handleLinkCourse} disabled={linkCourseMutation.isPending} className="w-full p-2.5 bg-primary text-white rounded-lg disabled:opacity-50">
                            {linkCourseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Link Course'}
                        </button>
                    </div>
                </div>
            )}

            {/* Create Branch Modal */}
            {isCreateBranchModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary w-full max-w-md p-6 rounded-xl border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Add Branch</h2>
                            <button onClick={() => setIsCreateBranchModalOpen(false)}><X className="w-5 h-5 text-text-muted" /></button>
                        </div>
                        <div className="space-y-4">
                            <select
                                value={createBranchData.course_id}
                                onChange={(e) => setCreateBranchData({ ...createBranchData, course_id: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary"
                            >
                                <option value="">Select Parent Course...</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>{c.course_name}</option>
                                ))}
                            </select>
                            <input
                                placeholder="Branch Name (e.g. Robotics)"
                                value={createBranchData.branch_name}
                                onChange={(e) => setCreateBranchData({ ...createBranchData, branch_name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary"
                            />
                            <input
                                placeholder="Branch Code (e.g. ROBO)"
                                value={createBranchData.branch_code}
                                onChange={(e) => setCreateBranchData({ ...createBranchData, branch_code: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-text-primary"
                            />
                            <button onClick={handleCreateBranch} disabled={createBranchMutation.isPending} className="w-full p-2.5 bg-primary text-white rounded-lg disabled:opacity-50">
                                {createBranchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create & Link'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Class Modal */}
            {isCreateClassModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-bg-secondary w-full max-w-md p-6 rounded-xl border border-white/10">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Add Class</h2>
                            <button onClick={() => setIsCreateClassModalOpen(false)}><X className="w-5 h-5 text-text-muted" /></button>
                        </div>
                        <div className="mb-4 text-sm text-text-secondary">
                            Adding class to: <span className="text-primary font-medium">{getBranchName(targetBranchId)}</span>
                        </div>
                        <input
                            placeholder="Class Label (e.g. 2024-CSE-A)"
                            value={classLabel}
                            onChange={(e) => setClassLabel(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg mb-4 text-text-primary"
                        />
                        <button onClick={handleCreateClass} disabled={createClassMutation.isPending} className="w-full p-2.5 bg-primary text-white rounded-lg disabled:opacity-50">
                            {createClassMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Class'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
