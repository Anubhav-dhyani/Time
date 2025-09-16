import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getAssignedTimetable, bookSlot, getMyTeachers } from '../controllers/student.controller.js';

const router = Router();

router.use(authenticate, requireRole('student'));

router.get('/timetable', getAssignedTimetable);
router.get('/my-teachers', getMyTeachers);
router.post('/book', bookSlot);
//nnn
export default router;
