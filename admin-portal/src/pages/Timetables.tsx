// ============================================
// Admin Portal - Timetable Management
// ============================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, Save, X, Loader2 } from 'lucide-react';

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
    { number: 5, start: '13:00', end: '14:00' },
    { number: 6, start: '14:00', end: '15:00' },
    { number: 7, start: '15:00', end: '16:00' },
    { number: 8, start: '16:00', end: '17:00' }
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

export default function Timetables() {
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
    const [draggedSubject, setDraggedSubject] = useState<ClassSubject | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const queryClient = useQueryClient();
    // Fetch classes
    const { data: classes = [] } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/academic/classes`);
            if (!res.ok) throw new Error('Failed to fetch classes');
            return res.json();
        }
    });

    // Fetch class subjects
    const { data: classSubjects = [], isLoading: isLoadingSubjects } = useQuery({
        queryKey: ['classSubjects', selectedClass],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/timetables/class/${selectedClass}/subjects`);
            if (!res.ok) throw new Error('Failed to fetch class subjects');
            return res.json();
        },
        enabled: !!selectedClass
    });

    // Fetch timetable
    useQuery({
        queryKey: ['timetable', selectedClass],
        queryFn: async () => {
            const res = await fetch(`${API_BASE}/timetables/class/${selectedClass}`);
            if (!res.ok) throw new Error('Failed to fetch timetable');
            const data = await res.json();
            setTimetableSlots(data.slots || []);
            return data;
        },
        enabled: !!selectedClass
    });

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

        // Check if slot already exists
        const existingSlot = timetableSlots.find(
            s => s.day_of_week === day && s.period_number === period
        );

        if (existingSlot) {
            // Update existing slot
            setTimetableSlots(prev =>
                prev.map(s =>
                    s.day_of_week === day && s.period_number === period
                        ? { ...s, class_subject_id: draggedSubject.id, class_subjects: draggedSubject }
                        : s
                )
            );
        } else {
            // Add new slot
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
            const res = await fetch(`${API_BASE}/timetables/class/${selectedClass}`, {
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
            queryClient.invalidateQueries({ queryKey: ['timetable', selectedClass] });
            setMessage({ type: 'success', text: 'Timetable saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        },
        onError: (error) => {
            console.error('Error saving timetable:', error);
            setMessage({ type: 'error', text: 'Failed to save timetable' });
            setTimeout(() => setMessage(null), 3000);
        }
    });

    const handleSaveTimetable = () => {
        if (!selectedClass) return;
        saveTimetableMutation.mutate();
    };

    const getSlot = (day: string, period: number) => {
        return timetableSlots.find(s => s.day_of_week === day && s.period_number === period);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-secondary" />
                        Timetable Management
                    </h1>
                    <p className="text-text-secondary mt-1">Create and manage class timetables</p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                    {message.text}
                </div>
            )}

            {/* Class Selection */}
            <div className="glass-card p-6 mb-6">
                <label className="block text-sm font-medium text-text-secondary mb-2">Select Class</label>
                <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="input max-w-md"
                >
                    <option value="">-- Select a class --</option>
                    {classes.map((cls: any) => (
                        <option key={cls.id} value={cls.id}>
                            {cls.courses?.name} - {cls.course_branches?.name} - {cls.section_name} ({cls.batches?.year})
                        </option>
                    ))}
                </select>
            </div>

            {selectedClass && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Timetable Grid */}
                    <div className="lg:col-span-3">
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-text-primary">Timetable Grid</h2>
                                <button
                                    onClick={handleSaveTimetable}
                                    disabled={saveTimetableMutation.isPending || timetableSlots.length === 0}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    {saveTimetableMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {saveTimetableMutation.isPending ? 'Saving...' : 'Save Timetable'}
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="border border-border p-2 bg-bg-secondary text-text-secondary text-sm font-medium">
                                                Period / Day
                                            </th>
                                            {DAYS.map(day => (
                                                <th key={day} className="border border-border p-2 bg-bg-secondary text-text-primary text-sm font-medium">
                                                    {DAY_LABELS[day]}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {PERIODS.map(period => (
                                            <tr key={period.number}>
                                                <td className="border border-border p-2 bg-bg-secondary text-center">
                                                    <div className="text-sm font-medium text-text-primary">Period {period.number}</div>
                                                    <div className="text-xs text-text-muted flex items-center justify-center gap-1 mt-1">
                                                        <Clock className="w-3 h-3" />
                                                        {period.start} - {period.end}
                                                    </div>
                                                </td>
                                                {DAYS.map(day => {
                                                    const slot = getSlot(day, period.number);
                                                    return (
                                                        <td
                                                            key={`${day}-${period.number}`}
                                                            className="border border-border p-2 min-w-[150px] h-20"
                                                            onDragOver={handleDragOver}
                                                            onDrop={() => handleDrop(day, period.number)}
                                                        >
                                                            {slot ? (
                                                                <div className="bg-primary/10 border border-primary/30 rounded p-2 relative group">
                                                                    <button
                                                                        onClick={() => handleRemoveSlot(day, period.number)}
                                                                        className="absolute -top-2 -right-2 w-5 h-5 bg-error text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                    <div className="text-sm font-medium text-text-primary">
                                                                        {slot.class_subjects?.subjects.code}
                                                                    </div>
                                                                    <div className="text-xs text-text-secondary mt-1">
                                                                        {slot.class_subjects?.professor_profiles?.users?.full_name}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="h-full flex items-center justify-center text-text-muted text-xs">
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
                    </div>

                    {/* Subject Panel */}
                    <div className="lg:col-span-1">
                        <div className="glass-card p-6 sticky top-6">
                            <h2 className="text-lg font-semibold text-text-primary mb-4">Class Subjects</h2>
                            {isLoadingSubjects ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin w-8 h-8 border-2 border-secondary border-t-transparent rounded-full mx-auto" />
                                </div>
                            ) : classSubjects.length === 0 ? (
                                <p className="text-text-muted text-sm">No subjects assigned to this class</p>
                            ) : (
                                <div className="space-y-2">
                                    {classSubjects.map((subject: ClassSubject) => (
                                        <div
                                            key={subject.id}
                                            draggable
                                            onDragStart={() => handleDragStart(subject)}
                                            className="p-3 bg-bg-secondary border border-border rounded-lg cursor-move hover:border-primary transition-colors"
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
            )}
        </div>
    );
}
