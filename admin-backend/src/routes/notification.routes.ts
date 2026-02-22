// ============================================
// Admin Backend - Notification Routes
// ============================================

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Get all notifications (for admin to view sent notifications)
router.get('/', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('notifications')
            .select(`
                *,
                users (full_name, email, role)
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        res.json(data || []);
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send notification to specific users
router.post('/send', async (req: Request, res: Response) => {
    try {
        const { recipientIds, title, message, notificationType, referenceType, referenceId } = req.body;

        if (!recipientIds || recipientIds.length === 0) {
            return res.status(400).json({ error: 'No recipients specified' });
        }

        const notifications = recipientIds.map((recipientId: string) => ({
            recipient_id: recipientId,
            title,
            message,
            notification_type: notificationType,
            reference_type: referenceType,
            reference_id: referenceId
        }));

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .insert(notifications)
            .select();

        if (error) throw error;

        res.json({ success: true, count: data.length });
    } catch (error: any) {
        console.error('Error sending notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send notification to all students in a class
router.post('/send-to-class', async (req: Request, res: Response) => {
    try {
        const { classId, title, message, notificationType } = req.body;

        // Get all students in the class
        const { data: students, error: studentsError } = await supabaseAdmin
            .from('student_profiles')
            .select('id')
            .eq('class_id', classId);

        if (studentsError) throw studentsError;

        if (!students || students.length === 0) {
            return res.status(400).json({ error: 'No students found in this class' });
        }

        const notifications = students.map(student => ({
            recipient_id: student.id,
            title,
            message,
            notification_type: notificationType
        }));

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .insert(notifications)
            .select();

        if (error) throw error;

        res.json({ success: true, count: data.length });
    } catch (error: any) {
        console.error('Error sending class notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send notification to all students
router.post('/send-to-all-students', async (req: Request, res: Response) => {
    try {
        const { title, message, notificationType } = req.body;

        // Get all student user IDs
        const { data: students, error: studentsError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('role', 'student')
            .eq('is_active', true);

        if (studentsError) throw studentsError;

        if (!students || students.length === 0) {
            return res.status(400).json({ error: 'No students found' });
        }

        const notifications = students.map(student => ({
            recipient_id: student.id,
            title,
            message,
            notification_type: notificationType
        }));

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .insert(notifications)
            .select();

        if (error) throw error;

        res.json({ success: true, count: data.length });
    } catch (error: any) {
        console.error('Error sending notifications to all students:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
