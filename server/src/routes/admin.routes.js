import { Router } from 'express';
import multer from 'multer';
import { authenticate, requireRole } from '../middleware/auth.js';
import { uploadTeachers, uploadStudents, listUsers, linkStudentTeacher, resetTeacherPassword, addSingleTeacher, addSingleStudent } from '../controllers/admin.controller.js';
import { User } from '../models/User.js';
import { Teacher } from '../models/Teacher.js';
import bcrypt from 'bcryptjs';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.post('/add-teacher', addSingleTeacher);
router.post('/add-student', addSingleStudent);
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

// Backfill students: normalize and propagate teacherIds from possibly delimited user.teacherId into Student.teacherIds
router.post('/maintenance/backfill-students', async (req, res) => {
	const students = await User.find({ role: 'student' });
	let updated = 0;
	const normalize = (v) => {
		if (!v) return [];
		if (Array.isArray(v)) return v.map(String).map((x) => x.trim()).filter(Boolean);
		return String(v).split(/[,;|\s]+/).map((x) => x.trim()).filter(Boolean);
	};
	for (const u of students) {
		const ids = normalize(u.teacherId);
		const s = await (await import('../models/Student.js')).Student.findOne({ email: u.email });
		if (!s) continue;
		const set = new Set([...(s.teacherIds || []), ...ids]);
		const next = Array.from(set);
		if (next.length === 0) continue;
		s.teacherIds = next;
		// Keep first for display compatibility
		if (!u.teacherId || u.teacherId !== next[0]) {
			u.teacherId = next[0];
			await u.save();
		}
		await s.save();
		updated++;
	}
	res.json({ updated });
});

export default router;
