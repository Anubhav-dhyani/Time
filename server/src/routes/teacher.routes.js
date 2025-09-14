import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getMyTimetable, upsertSlots, setSlotStatus, getBookings, getSetupTimetable, saveSetupTimetable, getDailyNotes, saveDailyNotes } from '../controllers/teacher.controller.js';

const router = Router();

router.use(authenticate, requireRole('teacher'));

router.get('/timetable', getMyTimetable);
router.get('/timetable/setup', getSetupTimetable);
router.post('/timetable/setup', saveSetupTimetable);
router.post('/timetable/upsert', upsertSlots);
router.post('/timetable/slot', setSlotStatus);
router.get('/bookings', getBookings);
// Daily notes management
router.get('/daily-notes', getDailyNotes);
router.post('/daily-notes', saveDailyNotes);

export default router;
