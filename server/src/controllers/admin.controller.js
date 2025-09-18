// Add single teacher (admin)
export async function addSingleTeacher(req, res) {
  try {
    const { name, email, password, teacherId } = req.body;
    if (!name || !email || !password || !teacherId) return res.status(400).json({ error: 'All fields required' });
    const passwordHash = await bcrypt.hash(password, 10);
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User with this email already exists' });
    user = await User.create({ role: 'teacher', name, email, passwordHash, teacherId });
    let teacher = await Teacher.findOne({ email });
    if (teacher) return res.status(400).json({ error: 'Teacher with this email already exists' });
    teacher = await Teacher.create({ teacherId, name, email, timetable: [] });
    res.json({ message: 'Teacher added', teacherId, name, email });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// Add single student (admin)
export async function addSingleStudent(req, res) {
  try {
    const { name, email, password, studentId, teacherIds } = req.body;
    if (!name || !email || !password || !studentId || !Array.isArray(teacherIds) || teacherIds.length === 0) return res.status(400).json({ error: 'All fields required' });
    const passwordHash = await bcrypt.hash(password, 10);
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User with this email already exists' });
    user = await User.create({ role: 'student', name, email, passwordHash, studentId, teacherId: teacherIds[0], mustChangePassword: true });
    let student = await Student.findOne({ email });
    if (student) return res.status(400).json({ error: 'Student with this email already exists' });
    student = await Student.create({ studentId, name, email, teacherIds });
    res.json({ message: 'Student added', studentId, name, email, teacherIds });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
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
  const allowed = ['name', 'email', 'password', 'studentId', 'teacherIds'];
  const legacy = ['teacherId'];
  if (rows.length > 0) {
    const fileColumns = Object.keys(rows[0]).map((c) => c.trim().toLowerCase());
    const normalizedAllowed = allowed.map((c) => c.toLowerCase());
    const normalizedLegacy = legacy.map((c) => c.toLowerCase());
    const extra = fileColumns.filter((c) => !normalizedAllowed.includes(c) && !normalizedLegacy.includes(c));
    // Must include name,email and at least one of teacherIds/teacherId
    const missingRequired = ['name', 'email'].filter((c) => !fileColumns.includes(c));
    const hasTeacherColumn = fileColumns.includes('teacherids') || fileColumns.includes('teacherid');
    if (extra.length > 0 || missingRequired.length > 0 || !hasTeacherColumn) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      const cols = [...allowed, ...legacy];
      return res.status(400).json({ error: `Invalid columns. Allowed: ${cols.join(', ')}. Extra: ${extra.join(', ')}. Missing required: ${missingRequired.join(', ')}. Must include teacherIds or teacherId.` });
    }
  }

  function parseTeacherIds(row) {
    const raw = row.teacherIds ?? row.teacherId ?? '';
    if (Array.isArray(raw)) return raw.map(String).map((x) => x.trim()).filter(Boolean);
    if (typeof raw !== 'string') return [];
    return raw
      .split(/[,;|\s]+/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  const created = [];
  for (const row of rows) {
    try {
      const name = row.name?.trim();
      const email = row.email?.trim().toLowerCase();
      const teacherIds = parseTeacherIds(row);
      if (!name || !email || teacherIds.length === 0) continue;
      const studentId = row.studentId || `S-${nanoid(6)}`;
      const password = row.password || nanoid(10);
      const passwordHash = await bcrypt.hash(password, 10);

      let user = await User.findOne({ email });
      if (user) {
        user.name = name;
        user.role = 'student';
        user.passwordHash = passwordHash;
        // Keep first teacherId for backward compatibility display only
        user.teacherId = teacherIds[0];
        user.mustChangePassword = true;
        await user.save();
      } else {
        user = await User.create({ role: 'student', name, email, passwordHash, teacherId: teacherIds[0], mustChangePassword: true });
      }

      const existing = await Student.findOne({ email });
      if (existing) {
        existing.studentId = studentId;
        // Merge with existing teacherIds to avoid losing manual links
        const set = new Set([...(existing.teacherIds || []), ...teacherIds]);
        existing.teacherIds = Array.from(set);
        await existing.save();
      } else {
        await Student.create({ studentId, name, email, teacherIds });
      }

      created.push({ studentId, name, email, teacherIds, password });
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

  // Map student email -> teacherIds
  const studentDocs = await Student.find({}).select('email teacherIds');
  const studentTeacherIds = new Map(studentDocs.map((s) => [s.email, s.teacherIds || []]));

  const enriched = users.map((u) => {
    const obj = u.toObject();
    const role = obj.role;
    const fallbackTeacherId = role === 'teacher' ? teachersByEmail.get(obj.email) || undefined : obj.teacherId;
    const ids = role === 'student' ? studentTeacherIds.get(obj.email) || [] : undefined;
    return {
      ...obj,
      teacherId: obj.teacherId || fallbackTeacherId,
      studentTeacherIds: ids,
    };
  });
  res.json({ users: enriched });
}

export async function linkStudentTeacher(req, res) {
  const { studentEmail } = req.body;
  let { teacherId, teacherIds } = req.body;
  const user = await User.findOne({ email: studentEmail, role: 'student' });
  if (!user) return res.status(404).json({ message: 'Student not found' });

  const student = await Student.findOne({ email: studentEmail });
  if (!student) return res.status(404).json({ message: 'Student profile not found' });

  let updatedIds;
  if (Array.isArray(teacherIds)) {
    updatedIds = Array.from(new Set(teacherIds.filter(Boolean)));
  } else if (typeof teacherId === 'string' && teacherId.trim()) {
    updatedIds = Array.from(new Set([...(student.teacherIds || []), teacherId.trim()]));
  } else {
    return res.status(400).json({ message: 'Provide teacherId or teacherIds' });
  }

  student.teacherIds = updatedIds;
  await student.save();

  // Keep first for backward compatible display only
  user.teacherId = updatedIds[0];
  await user.save();

  res.json({ message: 'Linked', teacherIds: updatedIds });
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
