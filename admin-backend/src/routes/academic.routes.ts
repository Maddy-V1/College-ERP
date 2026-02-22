// ============================================
// Admin Backend - Academic Routes
// ============================================

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// ============================================
// Validation Schemas
// ============================================

const createBatchSchema = z.object({
    batch_name: z.string().min(1),
    batch_year: z.number().min(2000).max(2100),
});

const createCourseSchema = z.object({
    course_name: z.string().min(1),
    course_code: z.string().min(1),
    duration_years: z.number().min(1).max(6).optional().default(4),
    degree_type: z.string().optional(),
});

const createBranchSchema = z.object({
    branch_name: z.string().min(1),
    branch_code: z.string().min(1),
    course_id: z.string().uuid(),
});

const createClassSchema = z.object({
    class_label: z.string().min(1),
    batch_id: z.string().uuid(),
    branch_id: z.string().uuid(),
    section_id: z.string().uuid().optional(),
    semester_id: z.string().uuid().optional(),
});

// ============================================
// BATCHES ROUTES
// ============================================

// GET /api/admin/v1/academic/batches
router.get('/batches', async (req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabaseAdmin
            .from('batches')
            .select('*')
            .order('batch_year', { ascending: false });

        if (error) {
            console.error('Error fetching batches:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch batches' });
            return;
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error in GET /batches:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/admin/v1/academic/batches/:id
router.get('/batches/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('batches')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            res.status(404).json({ success: false, message: 'Batch not found' });
            return;
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error in GET /batches/:id:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/admin/v1/academic/batches
router.post('/batches', async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = createBatchSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ success: false, message: 'Invalid data', errors: validation.error.errors });
            return;
        }

        const { batch_name, batch_year } = validation.data;

        const { data, error } = await supabaseAdmin
            .from('batches')
            .insert({
                batch_name,
                batch_year,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating batch:', error);
            res.status(500).json({ success: false, message: 'Failed to create batch' });
            return;
        }

        res.status(201).json({ success: true, message: 'Batch created', data });
    } catch (error) {
        console.error('Error in POST /batches:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// BATCH-COURSES ROUTES (Linking courses to batches)
// ============================================

// GET /api/admin/v1/academic/batches/:batchId/courses - Get courses for a batch
router.get('/batches/:batchId/courses', async (req: Request, res: Response): Promise<void> => {
    try {
        const { batchId } = req.params;

        const { data, error } = await supabaseAdmin
            .from('batch_courses')
            .select(`
                id,
                batch_id,
                course_id,
                is_active,
                created_at,
                courses (
                    id,
                    course_code,
                    course_name,
                    duration_years,
                    degree_type,
                    is_active
                )
            `)
            .eq('batch_id', batchId)
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching batch courses:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch courses for batch' });
            return;
        }

        // Flatten the response
        const courses = data?.map(bc => ({
            batch_course_id: bc.id,
            ...bc.courses
        })) || [];

        res.json({ success: true, data: courses });
    } catch (error) {
        console.error('Error in GET /batches/:batchId/courses:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/admin/v1/academic/batches/:batchId/courses - Add course to batch
router.post('/batches/:batchId/courses', async (req: Request, res: Response): Promise<void> => {
    try {
        const { batchId } = req.params;
        const { course_id, course_name, course_code, duration_years, degree_type } = req.body;

        // If course_id is provided, just link existing course
        if (course_id) {
            const { data, error } = await supabaseAdmin
                .from('batch_courses')
                .insert({
                    batch_id: batchId,
                    course_id: course_id,
                    is_active: true,
                })
                .select(`
                    id,
                    courses (*)
                `)
                .single();

            if (error) {
                console.error('Error linking course to batch:', error);
                res.status(500).json({ success: false, message: 'Failed to add course to batch' });
                return;
            }

            res.status(201).json({ success: true, message: 'Course added to batch', data });
            return;
        }

        // Otherwise, create new course and link it
        if (!course_name || !course_code) {
            res.status(400).json({ success: false, message: 'course_name and course_code are required' });
            return;
        }

        // Create the course
        const { data: newCourse, error: courseError } = await supabaseAdmin
            .from('courses')
            .insert({
                course_name,
                course_code,
                duration_years: duration_years || 4,
                degree_type: degree_type || null,
                is_active: true,
            })
            .select()
            .single();

        if (courseError) {
            console.error('Error creating course:', courseError);
            res.status(500).json({ success: false, message: 'Failed to create course' });
            return;
        }

        // Link course to batch
        const { data: batchCourse, error: linkError } = await supabaseAdmin
            .from('batch_courses')
            .insert({
                batch_id: batchId,
                course_id: newCourse.id,
                is_active: true,
            })
            .select()
            .single();

        if (linkError) {
            console.error('Error linking course to batch:', linkError);
            res.status(500).json({ success: false, message: 'Course created but failed to link to batch' });
            return;
        }

        res.status(201).json({
            success: true,
            message: 'Course created and added to batch',
            data: { ...newCourse, batch_course_id: batchCourse.id }
        });
    } catch (error) {
        console.error('Error in POST /batches/:batchId/courses:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/admin/v1/academic/batches/:batchId/courses/:courseId - Remove course from batch
router.delete('/batches/:batchId/courses/:courseId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { batchId, courseId } = req.params;

        const { error } = await supabaseAdmin
            .from('batch_courses')
            .update({ is_active: false })
            .eq('batch_id', batchId)
            .eq('course_id', courseId);

        if (error) {
            console.error('Error removing course from batch:', error);
            res.status(500).json({ success: false, message: 'Failed to remove course from batch' });
            return;
        }

        res.json({ success: true, message: 'Course removed from batch' });
    } catch (error) {
        console.error('Error in DELETE /batches/:batchId/courses/:courseId:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// COURSES ROUTES
// ============================================

// GET /api/admin/v1/academic/courses
router.get('/courses', async (req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabaseAdmin
            .from('courses')
            .select('*')
            .eq('is_active', true)
            .order('course_name');

        if (error) {
            console.error('Error fetching courses:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch courses' });
            return;
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error in GET /courses:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/admin/v1/academic/courses
router.post('/courses', async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = createCourseSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ success: false, message: 'Invalid data', errors: validation.error.errors });
            return;
        }

        const { course_name, course_code, duration_years, degree_type } = validation.data;

        // Check if course_code exists
        const { data: existing } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('course_code', course_code)
            .single();

        if (existing) {
            res.status(400).json({ success: false, message: 'Course code already exists' });
            return;
        }

        const { data, error } = await supabaseAdmin
            .from('courses')
            .insert({
                course_name,
                course_code,
                duration_years: duration_years || 4,
                degree_type: degree_type || null,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating course:', error);
            res.status(500).json({ success: false, message: 'Failed to create course' });
            return;
        }

        res.status(201).json({ success: true, message: 'Course created', data });
    } catch (error) {
        console.error('Error in POST /courses:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/admin/v1/academic/courses/:id
router.get('/courses/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('courses')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error in GET /courses/:id:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/admin/v1/academic/courses/:id
router.put('/courses/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { course_name, course_code, duration_years, degree_type, is_active } = req.body;

        // Check if course exists
        const { data: existing, error: fetchError } = await supabaseAdmin
            .from('courses')
            .select('id')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            res.status(404).json({ success: false, message: 'Course not found' });
            return;
        }

        // Build update object
        const updateData: Record<string, any> = {};
        if (course_name !== undefined) updateData.course_name = course_name;
        if (course_code !== undefined) updateData.course_code = course_code;
        if (duration_years !== undefined) updateData.duration_years = duration_years;
        if (degree_type !== undefined) updateData.degree_type = degree_type;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data, error } = await supabaseAdmin
            .from('courses')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating course:', error);
            res.status(500).json({ success: false, message: 'Failed to update course' });
            return;
        }

        res.json({ success: true, message: 'Course updated', data });
    } catch (error) {
        console.error('Error in PUT /courses/:id:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/admin/v1/academic/courses/:id
router.delete('/courses/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Soft delete: set is_active to false
        const { error } = await supabaseAdmin
            .from('courses')
            .update({
                is_active: false,
            })
            .eq('id', id);

        if (error) {
            console.error('Error deleting course:', error);
            res.status(500).json({ success: false, message: 'Failed to delete course' });
            return;
        }

        res.json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error in DELETE /courses/:id:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// BRANCHES ROUTES
// ============================================

// GET /api/admin/v1/academic/branches
router.get('/branches', async (req: Request, res: Response): Promise<void> => {
    try {
        const { course_id } = req.query;

        let query = supabaseAdmin
            .from('branches')
            .select('*')
            .eq('is_active', true)
            .order('branch_name');

        if (course_id) {
            query = query.eq('course_id', course_id);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching branches:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch branches' });
            return;
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error in GET /branches:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/admin/v1/academic/branches
router.post('/branches', async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = createBranchSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ success: false, message: 'Invalid data', errors: validation.error.errors });
            return;
        }

        const { branch_name, branch_code, course_id } = validation.data;

        // Check if branch_code exists for this course
        const { data: existing } = await supabaseAdmin
            .from('branches')
            .select('id')
            .eq('branch_code', branch_code)
            .eq('course_id', course_id)
            .single();

        if (existing) {
            res.status(400).json({ success: false, message: 'Branch code already exists for this course' });
            return;
        }

        const { data, error } = await supabaseAdmin
            .from('branches')
            .insert({
                branch_name,
                branch_code,
                course_id,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating branch:', error);
            res.status(500).json({ success: false, message: 'Failed to create branch' });
            return;
        }

        res.status(201).json({ success: true, message: 'Branch created', data });
    } catch (error) {
        console.error('Error in POST /branches:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// SECTIONS ROUTES (Linked to branches)
// ============================================

// GET /api/admin/v1/academic/branches/:branchId/sections - Get sections for a branch
router.get('/branches/:branchId/sections', async (req: Request, res: Response): Promise<void> => {
    try {
        const { branchId } = req.params;

        const { data, error } = await supabaseAdmin
            .from('sections')
            .select('*')
            .eq('branch_id', branchId)
            .eq('is_active', true)
            .order('section_name');

        if (error) {
            console.error('Error fetching sections:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch sections' });
            return;
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Error in GET /branches/:branchId/sections:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/admin/v1/academic/branches/:branchId/sections - Create section for a branch
router.post('/branches/:branchId/sections', async (req: Request, res: Response): Promise<void> => {
    try {
        const { branchId } = req.params;
        const { section_name, max_strength } = req.body;

        if (!section_name) {
            res.status(400).json({ success: false, message: 'section_name is required' });
            return;
        }

        // Check if section already exists for this branch
        const { data: existing } = await supabaseAdmin
            .from('sections')
            .select('id')
            .eq('branch_id', branchId)
            .eq('section_name', section_name)
            .single();

        if (existing) {
            res.status(400).json({ success: false, message: 'Section already exists for this branch' });
            return;
        }

        const { data, error } = await supabaseAdmin
            .from('sections')
            .insert({
                section_name,
                branch_id: branchId,
                max_strength: max_strength || 60,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating section:', error);
            res.status(500).json({ success: false, message: 'Failed to create section' });
            return;
        }

        res.status(201).json({ success: true, message: 'Section created', data });
    } catch (error) {
        console.error('Error in POST /branches/:branchId/sections:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/admin/v1/academic/sections - Get all sections (with optional branch filter)
router.get('/sections', async (req: Request, res: Response): Promise<void> => {
    try {
        const { branch_id } = req.query;

        let query = supabaseAdmin
            .from('sections')
            .select(`
                *,
                branches (
                    id,
                    branch_name,
                    branch_code,
                    courses (
                        id,
                        course_name,
                        course_code
                    )
                )
            `)
            .eq('is_active', true)
            .order('section_name');

        if (branch_id) {
            query = query.eq('branch_id', branch_id);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching sections:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch sections' });
            return;
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Error in GET /sections:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// CLASSES ROUTES
// ============================================

// GET /api/admin/v1/academic/classes
router.get('/classes', async (req: Request, res: Response): Promise<void> => {
    try {
        const { batch_id, branch_id } = req.query;

        let query = supabaseAdmin
            .from('classes')
            .select(`
        *,
        batches(id, batch_name, year),
        branches(id, branch_name, branch_code, courses(id, course_name, course_code)),
        sections(id, section_name)
      `)
            .order('class_label');

        if (batch_id) query = query.eq('batch_id', batch_id);
        if (branch_id) query = query.eq('branch_id', branch_id);

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching classes:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch classes' });
            return;
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error in GET /classes:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/admin/v1/academic/classes/:id
router.get('/classes/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from('classes')
            .select(`
        *,
        batches(id, batch_name, batch_year),
        branches(id, branch_name, branch_code, course_id),
        class_incharge:class_incharge_id(id, users(full_name)),
        class_representative:class_representative_id(id, users(full_name))
      `)
            .eq('id', id)
            .single();

        if (error || !data) {
            res.status(404).json({ success: false, message: 'Class not found' });
            return;
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error in GET /classes/:id:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/admin/v1/academic/classes
router.post('/classes', async (req: Request, res: Response): Promise<void> => {
    try {
        const validation = createClassSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ success: false, message: 'Invalid data', errors: validation.error.errors });
            return;
        }

        const { class_label, batch_id, branch_id, section_id, semester_id } = validation.data;

        // Check if class exists for this combination
        const { data: existing } = await supabaseAdmin
            .from('classes')
            .select('id')
            .eq('batch_id', batch_id)
            .eq('branch_id', branch_id)
            .eq('class_label', class_label)
            .single();

        if (existing) {
            res.status(400).json({ success: false, message: 'Class already exists for this batch and branch' });
            return;
        }

        const { data, error } = await supabaseAdmin
            .from('classes')
            .insert({
                class_label,
                batch_id,
                branch_id,
                section_id: section_id || null,
                semester_id: semester_id || null,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating class:', error);
            res.status(500).json({ success: false, message: 'Failed to create class' });
            return;
        }

        res.status(201).json({ success: true, message: 'Class created', data });
    } catch (error) {
        console.error('Error in POST /classes:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/admin/v1/academic/classes/:id
router.put('/classes/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { current_semester, class_incharge_id, class_representative_id } = req.body;

        const updateData: Record<string, any> = {};
        if (current_semester !== undefined) updateData.current_semester = current_semester;
        if (class_incharge_id !== undefined) updateData.class_incharge_id = class_incharge_id || null;
        if (class_representative_id !== undefined) updateData.class_representative_id = class_representative_id || null;

        const { data, error } = await supabaseAdmin
            .from('classes')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating class:', error);
            res.status(500).json({ success: false, message: 'Failed to update class' });
            return;
        }

        res.json({ success: true, message: 'Class updated', data });
    } catch (error) {
        console.error('Error in PUT /classes/:id:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// CLASS STUDENTS ROUTES
// ============================================

// GET /api/admin/v1/academic/classes/:classId/students - Get students in a class
router.get('/classes/:classId/students', async (req: Request, res: Response): Promise<void> => {
    try {
        const { classId } = req.params;

        const { data, error } = await supabaseAdmin
            .from('class_students')
            .select(`
                id,
                class_id,
                student_id,
                is_active,
                student_profiles (
                    id,
                    roll_number,
                    users (full_name, email)
                )
            `)
            .eq('class_id', classId)
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching class students:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch students' });
            return;
        }

        // Flatten the response
        const students = data?.map((cs: any) => ({
            id: cs.student_profiles?.id || cs.student_id,
            roll_number: cs.student_profiles?.roll_number || '',
            full_name: cs.student_profiles?.users?.full_name || 'Unknown',
            email: cs.student_profiles?.users?.email || '',
            is_active: cs.is_active,
        })) || [];

        res.json({ success: true, data: students });
    } catch (error) {
        console.error('Error in GET /classes/:classId/students:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/admin/v1/academic/classes/:classId/students - Add student to class
router.post('/classes/:classId/students', async (req: Request, res: Response): Promise<void> => {
    try {
        const { classId } = req.params;
        const { student_id } = req.body;

        if (!student_id) {
            res.status(400).json({ success: false, message: 'student_id is required' });
            return;
        }

        const { data, error } = await supabaseAdmin
            .from('class_students')
            .insert({
                class_id: classId,
                student_id,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding student to class:', error);
            if (error.code === '23505') {
                res.status(400).json({ success: false, message: 'Student is already in this class' });
                return;
            }
            res.status(500).json({ success: false, message: 'Failed to add student' });
            return;
        }

        res.status(201).json({ success: true, message: 'Student added to class', data });
    } catch (error) {
        console.error('Error in POST /classes/:classId/students:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/admin/v1/academic/students/:studentId/transfer - Transfer student to another class
router.post('/students/:studentId/transfer', async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const { from_class_id, to_class_id, reason } = req.body;

        if (!to_class_id) {
            res.status(400).json({ success: false, message: 'to_class_id is required' });
            return;
        }

        // Deactivate current class enrollment
        if (from_class_id) {
            await supabaseAdmin
                .from('class_students')
                .update({ is_active: false, left_on: new Date().toISOString().split('T')[0] })
                .eq('student_id', studentId)
                .eq('class_id', from_class_id)
                .eq('is_active', true);
        } else {
            // Deactivate all current active enrollments for this student
            await supabaseAdmin
                .from('class_students')
                .update({ is_active: false, left_on: new Date().toISOString().split('T')[0] })
                .eq('student_id', studentId)
                .eq('is_active', true);
        }

        // Create new class enrollment
        const { data: enrollment, error: enrollError } = await supabaseAdmin
            .from('class_students')
            .insert({
                class_id: to_class_id,
                student_id: studentId,
                is_active: true,
            })
            .select()
            .single();

        if (enrollError) {
            console.error('Error creating new enrollment:', enrollError);
            res.status(500).json({ success: false, message: 'Failed to transfer student' });
            return;
        }

        // Record transfer in transfer history (if table exists)
        try {
            await supabaseAdmin
                .from('student_class_transfers')
                .insert({
                    student_id: studentId,
                    from_class_id: from_class_id || null,
                    to_class_id,
                    reason: reason || null,
                });
        } catch {
            // Transfer history table might not exist yet - ignore
        }

        res.status(200).json({
            success: true,
            message: 'Student transferred successfully',
            data: enrollment
        });
    } catch (error) {
        console.error('Error in POST /students/:studentId/transfer:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/admin/v1/academic/classes/:classId/students/:studentId - Remove student from class
router.delete('/classes/:classId/students/:studentId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { classId, studentId } = req.params;

        const { error } = await supabaseAdmin
            .from('class_students')
            .update({ is_active: false, left_on: new Date().toISOString().split('T')[0] })
            .eq('class_id', classId)
            .eq('student_id', studentId)
            .eq('is_active', true);

        if (error) {
            console.error('Error removing student from class:', error);
            res.status(500).json({ success: false, message: 'Failed to remove student from class' });
            return;
        }

        res.json({ success: true, message: 'Student removed from class' });
    } catch (error) {
        console.error('Error in DELETE /classes/:classId/students/:studentId:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// CLASS SUBJECTS ROUTES
// ============================================

// GET /api/admin/v1/academic/classes/:classId/subjects - Get subjects for a class
router.get('/classes/:classId/subjects', async (req: Request, res: Response): Promise<void> => {
    try {
        const { classId } = req.params;

        const { data, error } = await supabaseAdmin
            .from('class_subjects')
            .select(`
                id,
                class_id,
                subject_id,
                professor_id,
                is_active,
                subjects (
                    id,
                    subject_code,
                    subject_name,
                    subject_type,
                    credits
                ),
                professor_profiles (
                    id,
                    users (full_name)
                )
            `)
            .eq('class_id', classId)
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching class subjects:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch class subjects' });
            return;
        }

        // Flatten the response
        const subjects = data?.map((cs: any) => ({
            id: cs.id,
            subject_id: cs.subject_id,
            subject_code: cs.subjects?.subject_code,
            subject_name: cs.subjects?.subject_name,
            subject_type: cs.subjects?.subject_type,
            credits: cs.subjects?.credits,
            professor_id: cs.professor_id,
            professor_name: cs.professor_profiles?.users?.full_name || 'Not assigned',
        })) || [];

        res.json({ success: true, data: subjects });
    } catch (error) {
        console.error('Error in GET /classes/:classId/subjects:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/admin/v1/academic/classes/:classId/subjects - Assign subject to class
router.post('/classes/:classId/subjects', async (req: Request, res: Response): Promise<void> => {
    try {
        const { classId } = req.params;
        const { subject_id, professor_id } = req.body;

        if (!subject_id) {
            res.status(400).json({ success: false, message: 'subject_id is required' });
            return;
        }

        const { data, error } = await supabaseAdmin
            .from('class_subjects')
            .insert({
                class_id: classId,
                subject_id,
                professor_id: professor_id || null,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error assigning subject:', error);
            res.status(500).json({ success: false, message: 'Failed to assign subject' });
            return;
        }

        res.status(201).json({ success: true, message: 'Subject assigned', data });
    } catch (error) {
        console.error('Error in POST /classes/:classId/subjects:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/admin/v1/academic/classes/:classId/subjects/:subjectId - Update subject assignment (assign professor)
router.put('/classes/:classId/subjects/:subjectId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { classId, subjectId } = req.params;
        const { professor_id } = req.body;

        const { data, error } = await supabaseAdmin
            .from('class_subjects')
            .update({ professor_id })
            .eq('class_id', classId)
            .eq('subject_id', subjectId)
            .select()
            .single();

        if (error) {
            console.error('Error updating subject assignment:', error);
            res.status(500).json({ success: false, message: 'Failed to update subject assignment' });
            return;
        }

        res.json({ success: true, message: 'Subject assignment updated', data });
    } catch (error) {
        console.error('Error in PUT /classes/:classId/subjects/:subjectId:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// CLASS REPRESENTATIVES ROUTES
// ============================================

// GET /api/admin/v1/academic/classes/:classId/representatives - Get class representatives
router.get('/classes/:classId/representatives', async (req: Request, res: Response): Promise<void> => {
    try {
        const { classId } = req.params;

        const { data, error } = await supabaseAdmin
            .from('class_representatives')
            .select(`
                id,
                class_id,
                student_id,
                representative_type,
                appointed_on,
                is_active,
                student_profiles (
                    id,
                    roll_number,
                    users (full_name, email)
                )
            `)
            .eq('class_id', classId)
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching class representatives:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch representatives' });
            return;
        }

        // Flatten the response
        const reps = data?.map((cr: any) => ({
            id: cr.id,
            student_id: cr.student_id,
            representative_type: cr.representative_type,
            appointed_on: cr.appointed_on,
            roll_number: cr.student_profiles?.roll_number,
            full_name: cr.student_profiles?.users?.full_name,
            email: cr.student_profiles?.users?.email,
        })) || [];

        res.json({ success: true, data: reps });
    } catch (error) {
        console.error('Error in GET /classes/:classId/representatives:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/admin/v1/academic/classes/:classId/representatives - Assign representative
router.post('/classes/:classId/representatives', async (req: Request, res: Response): Promise<void> => {
    try {
        const { classId } = req.params;
        const { student_id, representative_type } = req.body;

        if (!student_id || !representative_type) {
            res.status(400).json({ success: false, message: 'student_id and representative_type are required' });
            return;
        }

        // Deactivate existing representative of same type
        await supabaseAdmin
            .from('class_representatives')
            .update({ is_active: false })
            .eq('class_id', classId)
            .eq('representative_type', representative_type);

        const { data, error } = await supabaseAdmin
            .from('class_representatives')
            .insert({
                class_id: classId,
                student_id,
                representative_type,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error assigning representative:', error);
            res.status(500).json({ success: false, message: 'Failed to assign representative' });
            return;
        }

        res.status(201).json({ success: true, message: 'Representative assigned', data });
    } catch (error) {
        console.error('Error in POST /classes/:classId/representatives:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// CLASS TEACHER (IN-CHARGE) ROUTES
// ============================================

// PUT /api/admin/v1/academic/classes/:classId/teacher - Assign class teacher/in-charge
router.put('/classes/:classId/teacher', async (req: Request, res: Response): Promise<void> => {
    try {
        const { classId } = req.params;
        const { professor_id } = req.body;

        const { data, error } = await supabaseAdmin
            .from('classes')
            .update({ class_teacher_id: professor_id || null })
            .eq('id', classId)
            .select()
            .single();

        if (error) {
            console.error('Error updating class teacher:', error);
            res.status(500).json({ success: false, message: 'Failed to update class teacher' });
            return;
        }

        res.json({ success: true, message: 'Class teacher updated', data });
    } catch (error) {
        console.error('Error in PUT /classes/:classId/teacher:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// SUBJECTS ROUTES (Master list)
// ============================================

// GET /api/admin/v1/academic/subjects - Get all subjects
router.get('/subjects', async (req: Request, res: Response): Promise<void> => {
    try {
        const { data, error } = await supabaseAdmin
            .from('subjects')
            .select('*')
            .eq('is_active', true)
            .order('subject_name');

        if (error) {
            console.error('Error fetching subjects:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch subjects' });
            return;
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Error in GET /subjects:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/admin/v1/academic/subjects - Create subject
router.post('/subjects', async (req: Request, res: Response): Promise<void> => {
    try {
        const { subject_name, subject_code, subject_type, credits, lecture_hours, tutorial_hours, practical_hours } = req.body;

        if (!subject_name || !subject_code) {
            res.status(400).json({ success: false, message: 'subject_name and subject_code are required' });
            return;
        }

        const { data, error } = await supabaseAdmin
            .from('subjects')
            .insert({
                subject_name,
                subject_code,
                subject_type: subject_type || 'theory',
                credits: credits || 3,
                lecture_hours: lecture_hours || 3,
                tutorial_hours: tutorial_hours || 1,
                practical_hours: practical_hours || 0,
                is_active: true,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating subject:', error);
            res.status(500).json({ success: false, message: 'Failed to create subject' });
            return;
        }

        res.status(201).json({ success: true, message: 'Subject created', data });
    } catch (error) {
        console.error('Error in POST /subjects:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// PUT /api/admin/v1/academic/subjects/:id - Update subject
router.put('/subjects/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { subject_name, subject_code, subject_type, credits, lecture_hours, tutorial_hours, practical_hours } = req.body;

        const { data, error } = await supabaseAdmin
            .from('subjects')
            .update({
                subject_name,
                subject_code,
                subject_type,
                credits,
                lecture_hours,
                tutorial_hours,
                practical_hours,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating subject:', error);
            res.status(500).json({ success: false, message: 'Failed to update subject' });
            return;
        }

        res.json({ success: true, message: 'Subject updated', data });
    } catch (error) {
        console.error('Error in PUT /subjects/:id:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/admin/v1/academic/subjects/:id - Delete subject
router.delete('/subjects/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { error } = await supabaseAdmin
            .from('subjects')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            console.error('Error deleting subject:', error);
            res.status(500).json({ success: false, message: 'Failed to delete subject' });
            return;
        }

        res.json({ success: true, message: 'Subject deleted' });
    } catch (error) {
        console.error('Error in DELETE /subjects/:id:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// ============================================
// PROFESSOR-SUBJECTS ROUTES
// ============================================

// GET /api/admin/v1/academic/professors/:professorId/subjects - Get subjects a professor teaches
router.get('/professors/:professorId/subjects', async (req: Request, res: Response): Promise<void> => {
    try {
        const { professorId } = req.params;

        const { data, error } = await supabaseAdmin
            .from('professor_subjects')
            .select(`
                id,
                professor_id,
                subject_id,
                is_primary,
                is_active,
                subjects (
                    id,
                    subject_code,
                    subject_name,
                    subject_type,
                    credits
                )
            `)
            .eq('professor_id', professorId)
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching professor subjects:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch professor subjects' });
            return;
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Error in GET /professors/:professorId/subjects:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/admin/v1/academic/professors/:professorId/subjects - Assign subject to professor
router.post('/professors/:professorId/subjects', async (req: Request, res: Response): Promise<void> => {
    try {
        const { professorId } = req.params;
        const { subject_id, is_primary } = req.body;

        if (!subject_id) {
            res.status(400).json({ success: false, message: 'subject_id is required' });
            return;
        }

        const { data, error } = await supabaseAdmin
            .from('professor_subjects')
            .insert({
                professor_id: professorId,
                subject_id,
                is_primary: is_primary || false,
                is_active: true,
            })
            .select(`
                *,
                subjects (subject_code, subject_name)
            `)
            .single();

        if (error) {
            console.error('Error assigning subject to professor:', error);
            if (error.code === '23505') {
                res.status(400).json({ success: false, message: 'Professor is already assigned to this subject' });
                return;
            }
            res.status(500).json({ success: false, message: 'Failed to assign subject' });
            return;
        }

        res.status(201).json({ success: true, message: 'Subject assigned to professor', data });
    } catch (error) {
        console.error('Error in POST /professors/:professorId/subjects:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// DELETE /api/admin/v1/academic/professors/:professorId/subjects/:subjectId - Remove subject from professor
router.delete('/professors/:professorId/subjects/:subjectId', async (req: Request, res: Response): Promise<void> => {
    try {
        const { professorId, subjectId } = req.params;

        const { error } = await supabaseAdmin
            .from('professor_subjects')
            .update({ is_active: false })
            .eq('professor_id', professorId)
            .eq('subject_id', subjectId);

        if (error) {
            console.error('Error removing subject from professor:', error);
            res.status(500).json({ success: false, message: 'Failed to remove subject' });
            return;
        }

        res.json({ success: true, message: 'Subject removed from professor' });
    } catch (error) {
        console.error('Error in DELETE /professors/:professorId/subjects/:subjectId:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// GET /api/admin/v1/academic/subjects/:subjectId/professors - Get professors who teach a subject
router.get('/subjects/:subjectId/professors', async (req: Request, res: Response): Promise<void> => {
    try {
        const { subjectId } = req.params;

        const { data, error } = await supabaseAdmin
            .from('professor_subjects')
            .select(`
                id,
                professor_id,
                is_primary,
                professor_profiles (
                    id,
                    employee_id,
                    designation,
                    users (full_name, email)
                )
            `)
            .eq('subject_id', subjectId)
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching subject professors:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch professors' });
            return;
        }

        res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('Error in GET /subjects/:subjectId/professors:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;
