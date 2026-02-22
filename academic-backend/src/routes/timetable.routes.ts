// ============================================
// Academic Backend - Timetable Routes (Student/Professor)
// ============================================

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Get timetable for a class
router.get('/class/:classId', async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;

        // Get active timetable
        const { data: timetable, error: timetableError } = await supabaseAdmin
            .from('timetables')
            .select('*')
            .eq('class_id', classId)
            .eq('is_active', true)
            .single();

        if (timetableError && timetableError.code !== 'PGRST116') {
            throw timetableError;
        }

        if (!timetable) {
            return res.json({ timetable: null, slots: [] });
        }

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

        if (slotsError) throw slotsError;

        // Transform to match expected structure
        const transformedSlots = (slots || []).map(slot => ({
            ...slot,
            class_subjects: slot.class_subjects ? {
                ...slot.class_subjects,
                subjects: {
                    subject_name: slot.class_subjects.subjects?.subject_name,
                    subject_code: slot.class_subjects.subjects?.subject_code
                },
                professor_profiles: slot.class_subjects.professor_profiles ? {
                    id: slot.class_subjects.professor_profiles.id,
                    users: {
                        full_name: slot.class_subjects.professor_profiles.users?.full_name
                    }
                } : null
            } : null
        }));

        res.json({ timetable, slots: transformedSlots });
    } catch (error: any) {
        console.error('Error fetching timetable:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get timetable for a professor (all classes they teach)
router.get('/professor/:professorId', async (req: Request, res: Response) => {
    try {
        const { professorId } = req.params;

        // Get all class subjects for this professor
        const { data: classSubjects, error: csError } = await supabaseAdmin
            .from('class_subjects')
            .select('id, class_id')
            .eq('professor_id', professorId);

        if (csError) throw csError;

        if (!classSubjects || classSubjects.length === 0) {
            return res.json([]);
        }

        const classIds = [...new Set(classSubjects.map(cs => cs.class_id))];

        // Get timetables for these classes
        const { data: timetables, error: ttError } = await supabaseAdmin
            .from('timetables')
            .select('id, class_id')
            .in('class_id', classIds)
            .eq('is_active', true);

        if (ttError) throw ttError;

        if (!timetables || timetables.length === 0) {
            return res.json([]);
        }

        const timetableIds = timetables.map(tt => tt.id);
        const classSubjectIds = classSubjects.map(cs => cs.id);

        // Get slots for this professor
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
                    classes!inner (
                        id,
                        class_label,
                        sections (section_name),
                        branches (
                            branch_name,
                            branch_code,
                            courses (course_name)
                        ),
                        batches (
                            batch_name,
                            batch_year
                        )
                    )
                )
            `)
            .in('timetable_id', timetableIds)
            .in('class_subject_id', classSubjectIds);

        if (slotsError) throw slotsError;

        // Transform to match expected structure
        const transformedSlots = (slots || []).map(slot => {
            // Handle Supabase nested arrays
            const classData = Array.isArray(slot.class_subjects?.classes) ? slot.class_subjects.classes[0] : slot.class_subjects?.classes;
            const section = Array.isArray(classData?.sections) ? classData.sections[0] : classData?.sections;
            const branch = Array.isArray(classData?.branches) ? classData.branches[0] : classData?.branches;
            const course = Array.isArray(branch?.courses) ? branch.courses[0] : branch?.courses;
            const batch = Array.isArray(classData?.batches) ? classData.batches[0] : classData?.batches;

            return {
                ...slot,
                class_subjects: slot.class_subjects ? {
                    ...slot.class_subjects,
                    subjects: {
                        subject_name: slot.class_subjects.subjects?.subject_name,
                        subject_code: slot.class_subjects.subjects?.subject_code
                    },
                    classes: classData ? {
                        id: classData.id,
                        class_label: classData.class_label,
                        sections: section,
                        branches: {
                            ...branch,
                            courses: course,
                            branch_code: branch?.branch_code
                        },
                        batches: batch
                    } : null
                } : null
            };
        });

        res.json(transformedSlots);
    } catch (error: any) {
        console.error('Error fetching professor timetable:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get assigned classes for a professor (for dropdowns in Attendance/Marks pages)
router.get('/assigned-classes', async (req: Request, res: Response) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        // Get professor profile
        const { data: professor, error: profError } = await supabaseAdmin
            .from('professor_profiles')
            .select('id')
            .eq('user_id', user_id)
            .single();

        if (profError) throw profError;

        if (!professor) {
            return res.json([]);
        }

        // Get all class subjects for this professor
        const { data: classSubjects, error: csError } = await supabaseAdmin
            .from('class_subjects')
            .select(`
                id,
                class_id,
                subject_id,
                subjects (
                    subject_name,
                    subject_code
                ),
                classes (
                    id,
                    class_label,
                    sections (section_name),
                    branches (
                        branch_name,
                        branch_code,
                        courses (course_name)
                    ),
                    batches (
                        batch_name,
                        batch_year
                    )
                )
            `)
            .eq('professor_id', professor.id);

        if (csError) throw csError;

        // Transform to a simpler format
        const assignedClasses = (classSubjects || []).map(cs => {
            // Handle Supabase nested arrays
            const subject = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects;
            const classData = Array.isArray(cs.classes) ? cs.classes[0] : cs.classes;
            const section = Array.isArray(classData?.sections) ? classData.sections[0] : classData?.sections;
            const branch = Array.isArray(classData?.branches) ? classData.branches[0] : classData?.branches;
            const course = Array.isArray(branch?.courses) ? branch.courses[0] : branch?.courses;
            const batch = Array.isArray(classData?.batches) ? classData.batches[0] : classData?.batches;

            return {
                class_subject_id: cs.id,
                class_id: cs.class_id,
                subject_name: subject?.subject_name || 'Unknown',
                subject_code: subject?.subject_code || 'N/A',
                class_label: classData?.class_label || 'N/A',
                section_name: section?.section_name || '',
                branch_name: branch?.branch_name || '',
                branch_code: branch?.branch_code || '',
                course_name: course?.course_name || '',
                batch_name: batch?.batch_name || '',
                batch_year: batch?.batch_year || ''
            };
        });

        res.json(assignedClasses);
    } catch (error: any) {
        console.error('Error fetching assigned classes:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
