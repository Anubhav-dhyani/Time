import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadTeachers, uploadStudents, listUsers, linkStudentTeacher, resetTeacherPassword } from '../controllers/admin.controller.js';
import { User } from '../models/User.js';
import { Teacher } from '../models/Teacher.js';
import bcrypt from 'bcryptjs';

const upload = multer({ dest: 'uploads/' });
const router = Router();

router.use(authenticate, requireRole('admin'));

router.post('/upload/teachers', upload.single('file'), uploadTeachers);
router.post('/upload/students', upload.single('file'), uploadStudents);
router.get('/users', listUsers);
router.post('/link', linkStudentTeacher);
router.post('/reset-teacher-password', resetTeacherPassword);

// Backfill: sync user.teacherId from Teacher collection, set default password if missing
router.post('/maintenance/backfill-teachers', async (req, res) => {
	const teachers = await Teacher.find({});
	let updated = 0;
	for (const t of teachers) {
		const user = await User.findOne({ email: t.email });
		if (!user) continue;
		let changed = false;
		if (user.teacherId !== t.teacherId) { user.teacherId = t.teacherId; changed = true; }
		if (user.role !== 'teacher') { user.role = 'teacher'; changed = true; }
		if (!user.passwordHash) { user.passwordHash = await bcrypt.hash(t.teacherId, 10); changed = true; }
		if (changed) { await user.save(); updated++; }
	}
	res.json({ updated });
});

export default router;
