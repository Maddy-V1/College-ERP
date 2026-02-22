// ============================================
// Academic Backend - Notification Routes (Student)
// ============================================

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Get notifications for a student
router.get('/student/:studentId', async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('recipient_id', studentId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        res.json(data || []);
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mark notification as read
router.patch('/:notificationId/read', async (req: Request, res: Response) => {
    try {
        const { notificationId } = req.params;

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: error.message });
    }
});

// Mark all notifications as read for a student
router.patch('/student/:studentId/read-all', async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;

        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: true })
            .eq('recipient_id', studentId)
            .eq('is_read', false);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get unread count
router.get('/student/:studentId/unread-count', async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;

        const { count, error } = await supabaseAdmin
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', studentId)
            .eq('is_read', false);

        if (error) throw error;

        res.json({ count: count || 0 });
    } catch (error: any) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
