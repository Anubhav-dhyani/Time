import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getAssignedTimetable, bookSlot } from '../controllers/student.controller.js';

const router = Router();

router.use(authenticate, requireRole('student'));

router.get('/timetable', getAssignedTimetable);
router.post('/book', bookSlot);

export default router;
