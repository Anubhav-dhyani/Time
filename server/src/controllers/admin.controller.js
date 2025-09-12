import bcrypt from 'bcryptjs';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { parseCSVFile, parseExcelFile } from '../utils/csv.js';
import { User } from '../models/User.js';
import { Teacher } from '../models/Teacher.js';
import { Student } from '../models/Student.js';

function loadRows(file) {
  const ext = (file.originalname.split('.').pop() || '').toLowerCase();
  if (ext === 'csv') return parseCSVFile(file.path);
  if (ext === 'xlsx' || ext === 'xls') return parseExcelFile(file.path);
  throw Object.assign(new Error('Unsupported file type'), { status: 400 });
}

export async function uploadTeachers(req, res) {
  const rows = loadRows(req.file);
  const allowedColumns = ['name', 'email', 'password', 'teacherId'];
  if (rows.length > 0) {
    const fileColumns = Object.keys(rows[0]).map(c => c.trim().toLowerCase());
    const normalizedAllowed = allowedColumns.map(c => c.toLowerCase());
    const extra = fileColumns.filter(c => !normalizedAllowed.includes(c));
    const missing = normalizedAllowed.filter(c => !fileColumns.includes(c));
    if (extra.length > 0 || missing.length > 0) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: `Invalid columns. Allowed: ${allowedColumns.join(', ')}. Extra: ${extra.join(', ')}. Missing: ${missing.join(', ')}` });
    }
  }
  const created = [];
  for (const row of rows) {
    try {
      const name = row.name;
      if (!name) continue;
      const teacherId = row.teacherId || `T-${nanoid(6)}`;
      const email = row.email || `${teacherId.toLowerCase()}@example.com`;
      const password = row.password || nanoid(10);
      const passwordHash = await bcrypt.hash(password, 10);

      let user = await User.findOne({ email });
      if (user) {
        user.name = name; user.role = 'teacher'; user.passwordHash = passwordHash; user.teacherId = teacherId;
        await user.save();
      } else {
        user = await User.create({ role: 'teacher', name, email, passwordHash, teacherId });
      }

      let teacher = await Teacher.findOne({ email });
      if (teacher) {
        teacher.name = name; teacher.teacherId = teacherId;
        await teacher.save();
      } else {
        await Teacher.create({ teacherId, name, email, timetable: [] });
      }
      created.push({ teacherId, name, email, password });
    } catch (e) {
      created.push({ error: e.message, row });
    }
  }
  if (req.file?.path) fs.unlink(req.file.path, () => {});
  res.json({ created });
}

export async function uploadStudents(req, res) {
  const rows = loadRows(req.file);
  const allowedColumns = ['name', 'email', 'password', 'studentId', 'teacherId'];
  if (rows.length > 0) {
    const fileColumns = Object.keys(rows[0]).map(c => c.trim().toLowerCase());
    const normalizedAllowed = allowedColumns.map(c => c.toLowerCase());
    const extra = fileColumns.filter(c => !normalizedAllowed.includes(c));
    const missing = normalizedAllowed.filter(c => !fileColumns.includes(c));
    if (extra.length > 0 || missing.length > 0) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      return res.status(400).json({ error: `Invalid columns. Allowed: ${allowedColumns.join(', ')}. Extra: ${extra.join(', ')}. Missing: ${missing.join(', ')}` });
    }
  }
  const created = [];
  for (const row of rows) {
    try {
      const name = row.name;
      const email = row.email;
      const teacherId = row.teacherId;
      if (!name || !email || !teacherId) continue;
      const studentId = row.studentId || `S-${nanoid(6)}`;
      const password = row.password || nanoid(10);
      const passwordHash = await bcrypt.hash(password, 10);

      let user = await User.findOne({ email });
      if (user) {
        user.name = name; user.role = 'student'; user.passwordHash = passwordHash; user.teacherId = teacherId; user.mustChangePassword = true;
        await user.save();
      } else {
        user = await User.create({ role: 'student', name, email, passwordHash, teacherId, mustChangePassword: true });
      }

      const existing = await Student.findOne({ email });
      if (existing) {
        existing.studentId = studentId; existing.teacherId = teacherId; await existing.save();
      } else {
        await Student.create({ studentId, name, email, teacherId });
      }

      created.push({ studentId, name, email, teacherId, password });
    } catch (e) {
      created.push({ error: e.message, row });
    }
  }
  if (req.file?.path) fs.unlink(req.file.path, () => {});
  res.json({ created });
}

export async function listUsers(req, res) {
  const users = await User.find().select('-passwordHash');
  // Fallback: if a teacher user lacks teacherId, pull it from Teacher collection by email
  const teachersByEmail = new Map();
  const { Teacher } = await import('../models/Teacher.js');
  const teacherDocs = await Teacher.find({});
  for (const t of teacherDocs) teachersByEmail.set(t.email, t.teacherId);
  const enriched = users.map((u) => ({
    ...u.toObject(),
    teacherId: u.teacherId || (u.role === 'teacher' ? teachersByEmail.get(u.email) || undefined : u.teacherId),
  }));
  res.json({ users: enriched });
}

export async function linkStudentTeacher(req, res) {
  const { studentEmail, teacherId } = req.body;
  const user = await User.findOne({ email: studentEmail, role: 'student' });
  if (!user) return res.status(404).json({ message: 'Student not found' });
  user.teacherId = teacherId;
  await user.save();
  await Student.updateOne({ email: studentEmail }, { teacherId });
  res.json({ message: 'Linked' });
}

export async function resetTeacherPassword(req, res) {
  const { teacherId, email, password } = req.body;
  if (!password) return res.status(400).json({ message: 'Password required' });
  let teacher;
  if (teacherId) teacher = await Teacher.findOne({ teacherId });
  if (!teacher && email) teacher = await Teacher.findOne({ email });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  const user = await User.findOne({ email: teacher.email, role: 'teacher' });
  if (!user) return res.status(404).json({ message: 'Teacher user not found' });
  user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();
  res.json({ ok: true });
}
