// ============================================
// Admin Portal - Send Notifications
// ============================================

import { useState, useEffect } from 'react';
import { Bell, Send, Users, User } from 'lucide-react';

const API_BASE = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:4003/api/admin/v1';

export default function Notifications() {
    const [classes, setClasses] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [sendType, setSendType] = useState<'all' | 'class' | 'individual'>('all');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [notificationType, setNotificationType] = useState('general');
    const [isSending, setIsSending] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchClasses();
        fetchStudents();
    }, []);

    const fetchClasses = async () => {
        try {
            const res = await fetch(`${API_BASE}/academic/classes`);
            if (!res.ok) {
                console.error('Failed to fetch classes:', res.status);
                return;
            }
            const result = await res.json();
            console.log('Classes API response:', result);
            // API returns { success: true, data: [...] }
            setClasses(result.data || result || []);
        } catch (error) {
            console.error('Error fetching classes:', error);
            setClasses([]);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await fetch(`${API_BASE}/students`);
            if (!res.ok) {
                console.error('Failed to fetch students:', res.status);
                return;
            }
            const data = await res.json();
            console.log('Students API response:', data);
            setStudents(Array.isArray(data) ? data : data.data || []);
        } catch (error) {
            console.error('Error fetching students:', error);
            setStudents([]);
        }
    };

    const handleSendNotification = async () => {
        if (!title.trim() || !message.trim()) {
            setStatusMessage({ type: 'error', text: 'Please fill in title and message' });
            setTimeout(() => setStatusMessage(null), 3000);
            return;
        }

        try {
            setIsSending(true);
            let endpoint = '';
            let body: any = { title, message, notificationType };

            if (sendType === 'all') {
                endpoint = `${API_BASE}/notifications/send-to-all-students`;
            } else if (sendType === 'class') {
                if (!selectedClass) {
                    setStatusMessage({ type: 'error', text: 'Please select a class' });
                    setTimeout(() => setStatusMessage(null), 3000);
                    return;
                }
                endpoint = `${API_BASE}/notifications/send-to-class`;
                body.classId = selectedClass;
            } else {
                if (selectedStudents.length === 0) {
                    setStatusMessage({ type: 'error', text: 'Please select at least one student' });
                    setTimeout(() => setStatusMessage(null), 3000);
                    return;
                }
                endpoint = `${API_BASE}/notifications/send`;
                body.recipientIds = selectedStudents;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error('Failed to send notification');

            const data = await res.json();
            setStatusMessage({ type: 'success', text: `Notification sent to ${data.count} student(s)!` });
            
            // Reset form
            setTitle('');
            setMessage('');
            setSelectedClass('');
            setSelectedStudents([]);
            
            setTimeout(() => setStatusMessage(null), 5000);
        } catch (error) {
            console.error('Error sending notification:', error);
            setStatusMessage({ type: 'error', text: 'Failed to send notification' });
            setTimeout(() => setStatusMessage(null), 3000);
        } finally {
            setIsSending(false);
        }
    };

    const toggleStudentSelection = (studentId: string) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
                    <Bell className="w-6 h-6 text-secondary" />
                    Send Notifications
                </h1>
                <p className="text-text-secondary mt-1">Send announcements and updates to students</p>
            </div>

            {/* Status Message */}
            {statusMessage && (
                <div className={`mb-4 p-4 rounded-lg ${statusMessage.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                    {statusMessage.text}
                </div>
            )}

            <div className="glass-card p-6">
                {/* Send Type Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-3">Send To</label>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setSendType('all')}
                            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                                sendType === 'all'
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-bg-secondary text-text-secondary hover:border-primary/50'
                            }`}
                        >
                            <Users className="w-5 h-5 mx-auto mb-2" />
                            <div className="text-sm font-medium">All Students</div>
                        </button>
                        <button
                            onClick={() => setSendType('class')}
                            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                                sendType === 'class'
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-bg-secondary text-text-secondary hover:border-primary/50'
                            }`}
                        >
                            <Users className="w-5 h-5 mx-auto mb-2" />
                            <div className="text-sm font-medium">Specific Class</div>
                        </button>
                        <button
                            onClick={() => setSendType('individual')}
                            className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                                sendType === 'individual'
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-bg-secondary text-text-secondary hover:border-primary/50'
                            }`}
                        >
                            <User className="w-5 h-5 mx-auto mb-2" />
                            <div className="text-sm font-medium">Individual Students</div>
                        </button>
                    </div>
                </div>

                {/* Class Selection */}
                {sendType === 'class' && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-text-secondary mb-2">Select Class</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="input"
                        >
                            <option value="">-- Select a class --</option>
                            {Array.isArray(classes) && classes.length > 0 ? (
                                classes.map(cls => {
                                    const courseName = cls.branches?.courses?.course_name || 'N/A';
                                    const branchName = cls.branches?.branch_name || 'N/A';
                                    const sectionName = cls.sections?.section_name || 'N/A';
                                    const batchYear = cls.batches?.year || cls.batches?.batch_name || 'N/A';
                                    
                                    return (
                                        <option key={cls.id} value={cls.id}>
                                            {courseName} - {branchName} - {sectionName} ({batchYear})
                                        </option>
                                    );
                                })
                            ) : (
                                <option disabled>No classes available</option>
                            )}
                        </select>
                        {Array.isArray(classes) && classes.length === 0 && (
                            <p className="text-sm text-text-muted mt-2">No classes found. Please create classes first.</p>
                        )}
                    </div>
                )}

                {/* Student Selection */}
                {sendType === 'individual' && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-text-secondary mb-2">
                            Select Students ({selectedStudents.length} selected)
                        </label>
                        <div className="max-h-60 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
                            {students.map(student => (
                                <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-bg-secondary rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedStudents.includes(student.id)}
                                        onChange={() => toggleStudentSelection(student.id)}
                                        className="w-4 h-4"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-text-primary">{student.users?.full_name}</div>
                                        <div className="text-xs text-text-muted">{student.users?.email}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notification Type */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-2">Notification Type</label>
                    <select
                        value={notificationType}
                        onChange={(e) => setNotificationType(e.target.value)}
                        className="input"
                    >
                        <option value="general">General Announcement</option>
                        <option value="academic">Academic Update</option>
                        <option value="event">Event Notification</option>
                        <option value="urgent">Urgent Alert</option>
                        <option value="assignment">Assignment</option>
                        <option value="marks">Marks Update</option>
                    </select>
                </div>

                {/* Title */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-2">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter notification title"
                        className="input"
                    />
                </div>

                {/* Message */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-text-secondary mb-2">Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Enter notification message"
                        rows={6}
                        className="input resize-none"
                    />
                </div>

                {/* Send Button */}
                <button
                    onClick={handleSendNotification}
                    disabled={isSending}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                >
                    <Send className="w-4 h-4" />
                    {isSending ? 'Sending...' : 'Send Notification'}
                </button>
            </div>
        </div>
    );
}
