// ============================================
// Admin Backend - Timetable Routes
// ============================================

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Get timetable for a class
router.get('/class/:classId', async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;
        console.log('Fetching timetable for class:', classId);

        // Get active timetable
        const { data: timetable, error: timetableError } = await supabaseAdmin
            .from('timetables')
            .select('*')
            .eq('class_id', classId)
            .eq('is_active', true)
            .single();

        if (timetableError && timetableError.code !== 'PGRST116') {
            console.error('Error fetching timetable:', timetableError);
            throw timetableError;
        }

        if (!timetable) {
            console.log('No active timetable found for class:', classId);
            return res.json({ timetable: null, slots: [] });
        }

        console.log('Found timetable:', timetable.id);

        // Get timetable slots with subject and professor details
        const { data: slots, error: slotsError } = await supabaseAdmin
            .from('timetable_slots')
            .select(`
                *,
                class_subjects!inner (
                    id,
                    subject_id,
                    subjects!inner (
                        id,
                        subject_name,
                        subject_code
                    ),
                    professor_profiles (
                        id,
                        users!inner (
                            id,
                            full_name
                        )
                    )
                )
            `)
            .eq('timetable_id', timetable.id)
            .order('day_of_week')
            .order('period_number');

        if (slotsError) {
            console.error('Error fetching timetable slots:', slotsError);
            throw slotsError;
        }

        console.log('Raw slots data:', JSON.stringify(slots, null, 2));

        // Transform to match expected structure
        const transformedSlots = (slots || []).map(slot => ({
            ...slot,
            class_subjects: slot.class_subjects ? {
                ...slot.class_subjects,
                subjects: {
                    name: slot.class_subjects.subjects?.subject_name,
                    code: slot.class_subjects.subjects?.subject_code
                },
                professor_profiles: slot.class_subjects.professor_profiles ? {
                    id: slot.class_subjects.professor_profiles.id,
                    users: {
                        full_name: slot.class_subjects.professor_profiles.users?.full_name
                    }
                } : null
            } : null
        }));

        console.log('Transformed slots:', JSON.stringify(transformedSlots, null, 2));
        res.json({ timetable, slots: transformedSlots });
    } catch (error: any) {
        console.error('Exception fetching timetable:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// Get all class subjects for a class (for drag and drop)
router.get('/class/:classId/subjects', async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;
        console.log('Fetching subjects for class:', classId);

        const { data, error } = await supabaseAdmin
            .from('class_subjects')
            .select(`
                id,
                subject_id,
                class_id,
                professor_id,
                is_active,
                subjects!inner (
                    id,
                    subject_name,
                    subject_code
                ),
                professor_profiles (
                    id,
                    users!inner (
                        id,
                        full_name
                    )
                )
            `)
            .eq('class_id', classId)
            .eq('is_active', true);

        if (error) {
            console.error('Supabase error fetching class subjects:', error);
            return res.status(500).json({ error: error.message, details: error });
        }

        console.log('Raw data from Supabase:', JSON.stringify(data, null, 2));

        // Transform to match expected frontend structure
        const transformedData = (data || []).map(item => ({
            id: item.id,
            subject_id: item.subject_id,
            subjects: {
                name: item.subjects?.subject_name,
                code: item.subjects?.subject_code
            },
            professor_profiles: item.professor_profiles ? {
                id: item.professor_profiles.id,
                users: {
                    full_name: item.professor_profiles.users?.full_name
                }
            } : null
        }));

        console.log('Transformed data:', JSON.stringify(transformedData, null, 2));
        res.json(transformedData);
    } catch (error: any) {
        console.error('Exception fetching class subjects:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// Create or update timetable
router.post('/class/:classId', async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;
        const { slots, effectiveFrom, effectiveTo } = req.body;

        // Deactivate existing timetables
        await supabaseAdmin
            .from('timetables')
            .update({ is_active: false })
            .eq('class_id', classId);

        // Create new timetable
        const { data: timetable, error: timetableError } = await supabaseAdmin
            .from('timetables')
            .insert({
                class_id: classId,
                effective_from: effectiveFrom,
                effective_to: effectiveTo,
                is_active: true
            })
            .select()
            .single();

        if (timetableError) throw timetableError;

        // Insert slots
        if (slots && slots.length > 0) {
            const slotsToInsert = slots.map((slot: any) => ({
                timetable_id: timetable.id,
                class_subject_id: slot.class_subject_id,
                day_of_week: slot.day_of_week,
                period_number: slot.period_number,
                start_time: slot.start_time,
                end_time: slot.end_time,
                room_number: slot.room_number,
                slot_type: slot.slot_type || 'regular'
            }));

            const { error: slotsError } = await supabaseAdmin
                .from('timetable_slots')
                .insert(slotsToInsert);

            if (slotsError) throw slotsError;
        }

        res.json({ success: true, timetable });
    } catch (error: any) {
        console.error('Error creating timetable:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete timetable slot
router.delete('/slots/:slotId', async (req: Request, res: Response) => {
    try {
        const { slotId } = req.params;

        const { error } = await supabaseAdmin
            .from('timetable_slots')
            .delete()
            .eq('id', slotId);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting slot:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
