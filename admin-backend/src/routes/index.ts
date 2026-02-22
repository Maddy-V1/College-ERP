import { Router } from 'express';

import authRoutes from './auth.routes';
import professorRoutes from './professor.routes';
import studentRoutes from './student.routes';
import academicRoutes from './academic.routes';
import timetableRoutes from './timetable.routes';
import notificationRoutes from './notification.routes';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Resource routes
router.use('/professors', professorRoutes);
router.use('/students', studentRoutes);
router.use('/academic', academicRoutes);
router.use('/timetables', timetableRoutes);
router.use('/notifications', notificationRoutes);

export default router;
