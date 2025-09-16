
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getMyTimetable, upsertSlots, setSlotStatus, getBookings, getSetupTimetable, saveSetupTimetable, getDailyNotes, saveDailyNotes, uploadStudentsCsv, downloadBookingsCsv } from '../controllers/teacher.controller.js';
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });
const router = Router();

router.use(authenticate, requireRole('teacher'));
// Download all bookings for the week as CSV
router.get('/bookings-csv', downloadBookingsCsv);

router.get('/timetable', getMyTimetable);
// CSV upload for student assignment
router.post('/upload-students', upload.single('file'), uploadStudentsCsv);
router.get('/timetable/setup', getSetupTimetable);
router.post('/timetable/setup', saveSetupTimetable);
router.post('/timetable/upsert', upsertSlots);
router.post('/timetable/slot', setSlotStatus);
router.get('/bookings', getBookings);
// 
router.get('/daily-notes', getDailyNotes);
router.post('/daily-notes', saveDailyNotes);

export default router;
