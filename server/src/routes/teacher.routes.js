import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getMyTimetable, upsertSlots, setSlotStatus, getBookings } from '../controllers/teacher.controller.js';

const router = Router();

router.use(authenticate, requireRole('teacher'));

router.get('/timetable', getMyTimetable);
router.post('/timetable/upsert', upsertSlots);
router.post('/timetable/slot', setSlotStatus);
router.get('/bookings', getBookings);

export default router;
