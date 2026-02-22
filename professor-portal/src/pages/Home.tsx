import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header, PageContainer, Card, Badge, LoadingSpinner, EmptyState, Button } from '../components/Layout';

// Types
interface TodayClass {
    id: string;
    start_time: string;
    end_time: string;
    room_number: string;
    slot_type: string;
    subject_name: string;
    subject_code: string;
    class_label: string;
    class_id: string;
    class_subject_id: string;
    batch_name: string;
    branch_code: string;
    total_classes_conducted: number;
    student_count: number;
    cr: {
        id: string;
        name: string;
        phone: string;
        email: string;
        roll_number: string;
    } | null;
}

interface TodaySchedule {
    day_of_week: number;
    date: string;
    classes: TodayClass[];
}

interface WeeklyTimetable {
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room_number: string;
    slot_type: string;
    subject_name: string;
    subject_code: string;
    class_label?: string;
    class_id?: string;
    class_subject_id: string;
    professor_name?: string;
    batch_name?: string;
    branch_code?: string;
    total_classes_conducted?: number;
    student_count?: number;
}

const API_BASE = import.meta.env.VITE_ACADEMIC_API_URL || 'http://localhost:4002/api/academic/v1';

// Time Utility Functions
function formatTime(time: string): string {
    const parts = time.split(':');
    const hours = parts[0] || '0';
    const minutes = parts[1] || '00';
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'pm' : 'am';
    const hour12 = h % 12 || 12;
    if (minutes === '00') {
        return `${hour12}${ampm}`;
    }
    return `${hour12}:${minutes}${ampm}`;
}

function formatTimeRange(start: string, end: string): string {
    return `${formatTime(start)} - ${formatTime(end)}`;
}

function getTimePosition(time: string): number {
    const parts = time.split(':').map(Number);
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    const baseMinutes = 8 * 60;
    const currentMinutes = hours * 60 + minutes;
    return ((currentMinutes - baseMinutes) / 60) * 80;
}

function getSlotHeight(start: string, end: string): number {
    const startParts = start.split(':').map(Number);
    const endParts = end.split(':').map(Number);
    const startH = startParts[0] ?? 0;
    const startM = startParts[1] ?? 0;
    const endH = endParts[0] ?? 0;
    const endM = endParts[1] ?? 0;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return ((endMinutes - startMinutes) / 60) * 80;
}

function isCurrentClass(start: string, end: string): boolean {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startParts = start.split(':').map(Number);
    const endParts = end.split(':').map(Number);
    const startH = startParts[0] ?? 0;
    const startM = startParts[1] ?? 0;
    const endH = endParts[0] ?? 0;
    const endM = endParts[1] ?? 0;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

function isUpcoming(start: string): boolean {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startParts = start.split(':').map(Number);
    const startH = startParts[0] ?? 0;
    const startM = startParts[1] ?? 0;
    const startMinutes = startH * 60 + startM;
    return startMinutes > currentMinutes;
}

// Subject Colors for visual distinction
const SUBJECT_COLORS = [
    { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#60a5fa' },
    { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#34d399' },
    { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24' },
    { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#f87171' },
    { bg: 'rgba(139, 92, 246, 0.15)', border: '#8b5cf6', text: '#a78bfa' },
    { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', text: '#f472b6' },
    { bg: 'rgba(6, 182, 212, 0.15)', border: '#06b6d4', text: '#22d3ee' },
    { bg: 'rgba(132, 204, 22, 0.15)', border: '#84cc16', text: '#a3e635' },
];

function getSubjectColor(subjectCode: string): typeof SUBJECT_COLORS[0] {
    let hash = 0;
    for (let i = 0; i < subjectCode.length; i++) {
        hash = subjectCode.charCodeAt(i) + ((hash << 5) - hash);
    }
    return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length]!;
}

const DAY_NAMES = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Class Card Component (Mobile)
interface ClassCardProps {
    cls: TodayClass;
    onTakeAttendance: () => void;
    onContactCR: () => void;
}

function ClassCard({ cls, onTakeAttendance, onContactCR }: ClassCardProps) {
    const isCurrent = isCurrentClass(cls.start_time, cls.end_time);
    const upcoming = isUpcoming(cls.start_time);

    return (
        <Card
            className={`border-l-4 ${isCurrent
                ? 'border-l-success bg-success/5'
                : upcoming
                    ? 'border-l-primary'
                    : 'border-l-text-muted'
                }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    {/* Time */}
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-primary">
                            {formatTimeRange(cls.start_time, cls.end_time)}
                        </span>
                        {isCurrent && <Badge variant="success">Now</Badge>}
                        {upcoming && !isCurrent && <Badge variant="info">Upcoming</Badge>}
                    </div>

                    {/* Subject */}
                    <h3 className="text-base font-bold text-text-primary truncate">
                        {cls.subject_name}
                    </h3>

                    {/* Class & Room */}
                    <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
                        <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {cls.class_label}
                        </span>
                        {cls.room_number && (
                            <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Room {cls.room_number}
                            </span>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                        <span>{cls.student_count} students</span>
                        <span>•</span>
                        <span>{cls.total_classes_conducted} classes done</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    {cls.cr && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onContactCR(); }}
                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            title={`Contact CR: ${cls.cr.name}`}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Take Attendance Button */}
            <button
                onClick={onTakeAttendance}
                className="w-full mt-3 py-2 px-4 rounded-lg bg-primary/10 text-primary font-medium text-sm hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Take Attendance
            </button>
        </Card>
    );
}

// Timeline View Component (Mobile)
function TimelineView({ classes, onTakeAttendance, onContactCR }: {
    classes: TodayClass[];
    onTakeAttendance: (cls: TodayClass) => void;
    onContactCR: (cls: TodayClass) => void;
}) {
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

    return (
        <div className="relative">
            {/* Time labels */}
            <div className="absolute left-0 top-0 w-14 flex flex-col">
                {timeSlots.map((time) => (
                    <div
                        key={time}
                        className="h-20 text-xs text-text-muted flex items-start justify-end pr-2 pt-0.5"
                    >
                        {formatTime(time)}
                    </div>
                ))}
            </div>

            {/* Timeline line */}
            <div className="ml-16 relative" style={{ height: timeSlots.length * 80 }}>
                {/* Vertical line */}
                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" />

                {/* Hour markers */}
                {timeSlots.map((_, i) => (
                    <div
                        key={i}
                        className="absolute left-0 w-2 h-px bg-white/20"
                        style={{ top: i * 80 }}
                    />
                ))}

                {/* Current time indicator */}
                {(() => {
                    const now = new Date();
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    const baseMinutes = 8 * 60;
                    if (currentMinutes >= baseMinutes && currentMinutes <= 17 * 60) {
                        const position = ((currentMinutes - baseMinutes) / 60) * 80;
                        return (
                            <div
                                className="absolute right-0 flex items-center gap-1 z-10"
                                style={{ top: position, left: -8 }}
                            >
                                <div className="w-4 h-4 rounded-full bg-error animate-pulse" />
                                <div className="flex-1 h-0.5 bg-error/50" />
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* Class cards positioned on timeline */}
                {classes.map((cls) => {
                    const top = getTimePosition(cls.start_time);
                    const height = getSlotHeight(cls.start_time, cls.end_time);
                    const isCurrent = isCurrentClass(cls.start_time, cls.end_time);

                    return (
                        <div
                            key={cls.id}
                            className={`absolute left-4 right-0 rounded-lg p-3 ${isCurrent
                                ? 'bg-primary/20 border border-primary/30'
                                : 'bg-bg-secondary border border-white/10'
                                }`}
                            style={{ top, minHeight: Math.max(height - 8, 60) }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-primary font-medium">
                                        {formatTimeRange(cls.start_time, cls.end_time)}
                                    </p>
                                    <h4 className="font-semibold text-text-primary truncate">
                                        {cls.subject_name}
                                    </h4>
                                    <p className="text-xs text-text-secondary">
                                        {cls.class_label} {cls.room_number && `• Room ${cls.room_number}`}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {cls.cr && (
                                        <button
                                            onClick={() => onContactCR(cls)}
                                            className="p-1.5 rounded-md bg-white/5 text-text-secondary hover:text-primary"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onTakeAttendance(cls)}
                                        className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Weekly Grid View (Responsive) - EXACT COPY FROM STUDENT PORTAL
function WeeklyGridView({ timetable }: { timetable: WeeklyTimetable[] }) {
    const [visibleDays, setVisibleDays] = useState(5);
    const [selectedDay, setSelectedDay] = useState(() => {
        const today = new Date().getDay();
        return today >= 1 && today <= 5 ? today : 1;
    });

    // Time slots - 9 AM to 5:30 PM with lunch break at 1:00-1:30 PM
    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '13:30', '14:30', '15:30', '16:30', '17:30'];
    const days = [1, 2, 3, 4, 5];
    const dayFullNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const today = new Date().getDay() === 0 ? 7 : new Date().getDay();
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const isWithinSchedule = currentHour >= 9 && currentHour < 17;

    // Responsive detection
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) setVisibleDays(1);
            else if (width < 1024) setVisibleDays(3);
            else setVisibleDays(5);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const timetableByDay = days.map(day => ({
        day,
        classes: timetable.filter(slot => slot.day_of_week === day)
    }));

    const rowHeight = 50; // Height per hour slot
    
    // Calculate position considering lunch break and new time structure
    const getClassPosition = (startTime: string) => {
        const [hourStr, minStr] = startTime.split(':');
        const hour = parseInt(hourStr || '9');
        const minute = parseInt(minStr || '0');
        const startMin = hour * 60 + minute;
        
        // Time slot mapping:
        // 9:00 -> row 0
        // 10:00 -> row 1
        // 11:00 -> row 2
        // 12:00 -> row 3
        // 13:00 -> row 4 (lunch)
        // 13:30 -> row 5 (after lunch break, half row down)
        // 14:30 -> row 6
        // 15:30 -> row 7
        // 16:30 -> row 8
        // 17:30 -> row 9
        
        if (hour < 13) {
            // Before 1 PM: 9am, 10am, 11am, 12pm
            return (hour - 9) * rowHeight;
        } else if (hour === 13 && minute === 0) {
            // 1:00 PM - lunch time
            return 4 * rowHeight;
        } else if (hour === 13 && minute === 30) {
            // 1:30 PM - right after lunch break
            return 4 * rowHeight + (rowHeight / 2);
        } else {
            // After 1:30 PM: 2:30, 3:30, 4:30, 5:30
            // 14:30 -> 5.5 rows, 15:30 -> 6.5 rows, etc.
            const hoursFrom9 = hour - 9;
            return hoursFrom9 * rowHeight + (rowHeight / 2);
        }
    };

    // Get days to display
    const getDaysToShow = () => {
        if (visibleDays === 1) return [selectedDay];
        if (visibleDays === 3) {
            if (selectedDay <= 2) return [1, 2, 3];
            if (selectedDay >= 4) return [3, 4, 5];
            return [selectedDay - 1, selectedDay, selectedDay + 1];
        }
        return days;
    };
    const daysToShow = getDaysToShow();

    const goToPrevDay = () => setSelectedDay(prev => Math.max(1, prev - 1));
    const goToNextDay = () => setSelectedDay(prev => Math.min(5, prev + 1));

    return (
        <div className="rounded-2xl bg-bg-secondary/50 border border-white/10 overflow-hidden shadow-lg">
            {/* Header Row: Time label + Day selector with arrows */}
            <div className="flex border-b border-white/10">
                {/* Time label (corner 0,0) */}
                <div className="flex-shrink-0 w-14 h-11 flex items-center justify-center bg-bg-tertiary/50 border-r border-white/10">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Time</span>
                </div>

                {/* Day Header with arrows (mobile/tablet) or all days (desktop) */}
                {visibleDays < 5 ? (
                    <div className="flex-1 h-11 flex items-center justify-between px-3 bg-bg-tertiary/30">
                        <button
                            onClick={goToPrevDay}
                            disabled={selectedDay === 1}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-secondary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="text-center">
                            <p className={`text-sm font-bold ${selectedDay === today ? 'text-primary' : 'text-text-primary'}`}>
                                {dayFullNames[selectedDay]}
                                {selectedDay === today && (
                                    <span className="ml-2 text-xs font-normal text-primary">(Today)</span>
                                )}
                            </p>
                        </div>

                        <button
                            onClick={goToNextDay}
                            disabled={selectedDay === 5}
                            className="w-9 h-9 flex items-center justify-center rounded-full bg-bg-secondary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 grid grid-cols-5">
                        {days.map(day => (
                            <div
                                key={`h-${day}`}
                                className={`h-11 flex items-center justify-center font-semibold text-sm border-l border-white/5 ${day === today
                                    ? 'bg-primary/15 text-primary'
                                    : 'text-text-secondary'
                                    }`}
                            >
                                {DAY_NAMES[day]}
                                {day === today && <span className="ml-2 w-2 h-2 rounded-full bg-primary animate-pulse" />}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Grid: Timeline + Day Columns */}
            <div className="flex">
                {/* Time Column - using absolute positioning for proper alignment */}
                <div className="flex-shrink-0 w-14 bg-bg-tertiary/30 border-r border-white/10 relative" style={{ height: `${(timeSlots.length - 1) * rowHeight + rowHeight / 2}px` }}>
                    {timeSlots.map((time, index) => {
                        const hour = parseInt(time.split(':')[0] || '0');
                        const minute = parseInt(time.split(':')[1] || '0');
                        const isLunch = hour === 13 && minute === 0;
                        const isLunchEnd = hour === 13 && minute === 30;
                        const isCurrentHour = currentHour === hour && (minute === 0 ? currentMinute < 30 : currentMinute >= 30);
                        
                        // Position: regular slots, but 1:30 PM is half slot after 1:00 PM
                        const topPosition = index <= 4 ? index * rowHeight : (index - 1) * rowHeight + rowHeight / 2;

                        return (
                            <div
                                key={time}
                                className={`absolute right-0 pr-2 text-[11px] font-medium -translate-y-1/2 ${isLunch ? 'text-warning font-bold' :
                                    isLunchEnd ? 'text-warning/70' :
                                        isCurrentHour ? 'text-primary font-bold' : 'text-text-muted'
                                    }`}
                                style={{ top: `${topPosition}px` }}
                            >
                                {formatTime(time)}
                            </div>
                        );
                    })}
                </div>

                {/* Day Columns */}
                <div className={`flex-1 grid ${visibleDays === 5 ? 'grid-cols-5' : visibleDays === 3 ? 'grid-cols-3' : 'grid-cols-1'}`}>
                    {daysToShow.map(day => (
                        <div
                            key={`c-${day}`}
                            className={`relative border-l border-white/5 ${day === today ? 'bg-primary/5' : ''}`}
                            style={{ height: `${(timeSlots.length - 1) * rowHeight + rowHeight / 2}px` }}
                        >
                            {/* Hour grid lines */}
                            {timeSlots.map((_, i) => {
                                const topPosition = i <= 4 ? i * rowHeight : (i - 1) * rowHeight + rowHeight / 2;
                                return (
                                    <div
                                        key={i}
                                        className="absolute left-0 right-0 border-t border-white/8"
                                        style={{ top: `${topPosition}px` }}
                                    />
                                );
                            })}

                            {/* Lunch break indicator - 1:00-1:30 PM with border */}
                            <div
                                className="absolute left-0 right-0 bg-warning/10 border-t-2 border-b-2 border-warning/30 flex items-center justify-center pointer-events-none z-10"
                                style={{
                                    top: `${4 * rowHeight}px`,
                                    height: `${rowHeight / 2}px`
                                }}
                            >
                                <span className="text-[10px] font-bold text-warning uppercase tracking-wider">🍽️ Lunch Break</span>
                            </div>

                            {/* Current time indicator */}
                            {day === today && isWithinSchedule && (
                                <div
                                    className="absolute left-0 right-0 h-0.5 bg-error z-20"
                                    style={{ top: `${(currentHour - 9) * rowHeight + (currentMinute / 60) * rowHeight}px` }}
                                >
                                    <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-error shadow-lg shadow-error/50" />
                                </div>
                            )}

                            {/* Classes */}
                            {timetableByDay.find(d => d.day === day)?.classes.map(cls => {
                                const color = getSubjectColor(cls.subject_code);
                                const startMin = parseInt(cls.start_time.split(':')[0] || '9') * 60 + parseInt(cls.start_time.split(':')[1] || '0');
                                const endMin = parseInt(cls.end_time.split(':')[0] || '10') * 60 + parseInt(cls.end_time.split(':')[1] || '0');
                                const top = getClassPosition(cls.start_time);
                                const height = ((endMin - startMin) / 60) * rowHeight;

                                return (
                                    <div
                                        key={cls.id}
                                        className="absolute left-2 right-2 rounded-xl p-2.5 overflow-hidden hover:brightness-110 hover:scale-[1.02] transition-all shadow-md cursor-pointer z-20"
                                        style={{
                                            top: `${top + 3}px`,
                                            height: `${Math.max(height - 6, 40)}px`,
                                            backgroundColor: color.bg,
                                            borderLeft: `4px solid ${color.border}`,
                                        }}
                                    >
                                        <p className="text-sm font-bold truncate leading-tight" style={{ color: color.text }}>{cls.class_label || 'Class'}</p>
                                        {height > 50 && (
                                            <div className="mt-1 space-y-0.5">
                                                <p className="text-xs text-text-secondary truncate flex items-center gap-1">
                                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                    </svg>
                                                    <span className="truncate">{cls.subject_name}</span>
                                                </p>
                                                <p className="text-xs text-text-muted truncate flex items-center gap-1">
                                                    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    </svg>
                                                    <span className="truncate">Room {cls.room_number || '-'}</span>
                                                </p>
                                            </div>
                                        )}
                                        {height <= 50 && height > 30 && (
                                            <p className="text-[10px] text-text-muted truncate mt-0.5">
                                                {cls.subject_name} • Room {cls.room_number || '-'}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Empty state */}
                            {timetableByDay.find(d => d.day === day)?.classes.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center opacity-50">
                                        <svg className="w-10 h-10 mx-auto text-text-muted/40 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm text-text-muted">No classes</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Main Home Component
export default function Home() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [schedule, setSchedule] = useState<TodaySchedule | null>(null);
    const [weeklyTimetable, setWeeklyTimetable] = useState<WeeklyTimetable[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
    const [selectedCR, setSelectedCR] = useState<{ cr: TodayClass['cr']; className: string } | null>(null);
    const [isDesktop, setIsDesktop] = useState(false);

    // Check if desktop
    useEffect(() => {
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 1440);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    // Fetch data
    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            console.log('Fetching professor profile to get professor_id...');
            
            // First, get professor profile to find their professor_id
            const profileRes = await fetch(`${API_BASE}/professor/profile?user_id=${user.id}`);
            if (!profileRes.ok) {
                throw new Error('Failed to fetch professor profile');
            }
            const profileData = await profileRes.json();
            
            if (!profileData.success || !profileData.data) {
                throw new Error('Invalid profile response');
            }
            
            const professorId = profileData.data.id; // This is the professor_profiles.id
            
            if (!professorId) {
                throw new Error('Professor profile not found');
            }

            console.log('Professor ID:', professorId);
            
            // Fetch professor's timetable
            const timetableRes = await fetch(`${API_BASE}/timetable/professor/${professorId}`);
            
            if (!timetableRes.ok) {
                throw new Error(`Failed to fetch timetable: ${timetableRes.status}`);
            }
            
            const timetableData = await timetableRes.json();
            console.log('Timetable data received:', timetableData);

            // Transform the data to match the expected format
            const transformedData: WeeklyTimetable[] = (Array.isArray(timetableData) ? timetableData : []).map(slot => {
                // Map day_of_week string to number (1=Monday, 5=Friday)
                const dayMap: Record<string, number> = {
                    'monday': 1,
                    'tuesday': 2,
                    'wednesday': 3,
                    'thursday': 4,
                    'friday': 5,
                    'saturday': 6
                };

                return {
                    id: slot.id,
                    day_of_week: dayMap[slot.day_of_week?.toLowerCase()] ?? 1,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    slot_type: slot.slot_type || 'regular',
                    subject_name: slot.class_subjects?.subjects?.subject_name || 'Unknown Subject',
                    subject_code: slot.class_subjects?.subjects?.subject_code || 'N/A',
                    professor_name: user.fullName || 'You',
                    room_number: slot.room_number || '',
                    class_label: slot.class_subjects?.classes?.class_label || 'N/A',
                    class_id: slot.class_subjects?.classes?.id || '',
                    class_subject_id: slot.class_subject_id || slot.id,
                    batch_name: slot.class_subjects?.classes?.batches?.batch_name || 'N/A',
                    branch_code: slot.class_subjects?.classes?.branches?.branch_code || 'N/A',
                    total_classes_conducted: 0,
                    student_count: 0
                };
            });

            console.log('Transformed timetable:', transformedData);
            setWeeklyTimetable(transformedData);

            // Filter today's schedule
            const today = new Date().getDay(); // 0=Sunday, 1=Monday, etc.
            const todayIndex = today === 0 ? 7 : today; // Keep as 1-7 (Monday=1, Sunday=7)
            const todayClasses = transformedData.filter(slot => slot.day_of_week === todayIndex);

            if (todayClasses.length > 0) {
                setSchedule({
                    day_of_week: todayIndex,
                    date: new Date().toISOString().split('T')[0]!,
                    classes: todayClasses.map(cls => ({
                        id: cls.id,
                        start_time: cls.start_time,
                        end_time: cls.end_time,
                        room_number: cls.room_number,
                        slot_type: cls.slot_type,
                        subject_name: cls.subject_name,
                        subject_code: cls.subject_code,
                        class_label: cls.class_label || 'N/A',
                        class_id: cls.class_id || '',
                        class_subject_id: cls.class_subject_id,
                        batch_name: cls.batch_name || 'N/A',
                        branch_code: cls.branch_code || 'N/A',
                        total_classes_conducted: cls.total_classes_conducted || 0,
                        student_count: cls.student_count || 0,
                        cr: null
                    }))
                });
            }

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load timetable. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleTakeAttendance = (cls: TodayClass) => {
        navigate(`/attendance/take/${cls.class_subject_id}`, {
            state: {
                classSubject: cls,
                date: schedule?.date
            }
        });
    };

    const handleContactCR = (cls: TodayClass) => {
        if (cls.cr) {
            setSelectedCR({ cr: cls.cr, className: cls.class_label });
        }
    };

    return (
        <PageContainer header={<Header showDate showNotification />}>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Card className="text-center">
                    <p className="text-2xl font-bold text-primary">
                        {schedule?.classes.length || 0}
                    </p>
                    <p className="text-xs text-text-secondary">Classes Today</p>
                </Card>
                <Card className="text-center">
                    <p className="text-2xl font-bold text-success">
                        {schedule?.classes.reduce((sum, c) => sum + c.student_count, 0) || 0}
                    </p>
                    <p className="text-xs text-text-secondary">Total Students</p>
                </Card>
            </div>

            {/* View Toggle (Mobile) */}
            {!isDesktop && (
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-text-primary">Today's Schedule</h2>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-bg-secondary">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${viewMode === 'list'
                                ? 'bg-primary text-white'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('timeline')}
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${viewMode === 'timeline'
                                ? 'bg-primary text-white'
                                : 'text-text-secondary hover:text-text-primary'
                                }`}
                        >
                            Timeline
                        </button>
                    </div>
                </div>
            )}

            {/* Weekly Timetable - Full Grid with all days and time slots */}
            <div className="mb-6">
                <h2 className="text-lg font-bold text-text-primary mb-4">Weekly Timetable</h2>
                <WeeklyGridView timetable={weeklyTimetable} />
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <EmptyState
                    icon={
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    }
                    title="Unable to load schedule"
                    description={error}
                    action={
                        <Button onClick={fetchData} variant="secondary">
                            Try Again
                        </Button>
                    }
                />
            )}

            {/* Empty State for Today */}
            {!loading && !error && schedule?.classes.length === 0 && (
                <EmptyState
                    icon={
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    }
                    title="No classes today"
                    description="Enjoy your day off! Check back on your next working day."
                />
            )}

            {/* Mobile: Today's Classes */}
            {!isDesktop && !loading && !error && schedule && schedule.classes.length > 0 && (
                <div className="mb-6">
                    {viewMode === 'list' ? (
                        <div className="space-y-3">
                            {schedule.classes.map((cls) => (
                                <ClassCard 
                                    key={cls.id} 
                                    cls={cls} 
                                    onTakeAttendance={() => handleTakeAttendance(cls)}
                                    onContactCR={() => handleContactCR(cls)}
                                />
                            ))}
                        </div>
                    ) : (
                        <TimelineView 
                            classes={schedule.classes} 
                            onTakeAttendance={handleTakeAttendance}
                            onContactCR={handleContactCR}
                        />
                    )}
                </div>
            )}
        </PageContainer>
    );
}