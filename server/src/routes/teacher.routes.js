
import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import multer from 'multer';
import { getMyTimetable, upsertSlots, setSlotStatus, getBookings, getSetupTimetable, saveSetupTimetable, getDailyNotes, saveDailyNotes, uploadStudentsCsv, downloadBookingsCsv, getMyStudents, addSingleStudentTeacher } from '../controllers/teacher.controller.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/add-student', addSingleStudentTeacher);

router.use(authenticate, requireRole('teacher'));
// Get all students assigned to this teacher
router.get('/students', getMyStudents);
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
