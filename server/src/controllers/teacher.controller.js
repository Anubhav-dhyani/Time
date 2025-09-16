import { Teacher } from '../models/Teacher.js';
import { Booking } from '../models/Booking.js';
import { Student } from '../models/Student.js';
import { User } from '../models/User.js';
import Papa from 'papaparse';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import path from 'path';
  
export async function downloadBookingsCsv(req, res) {
  
  if (!req.user || !req.user.email) {
    return res.status(401).json({ message: 'Unauthorized: missing user context' });
  }
  const teacher = await Teacher.findOne({ email: req.user.email });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  
  const bookings = await Booking.find({ teacherId: teacher.teacherId });
  
  const userIds = bookings.map(b => b.studentUserId).filter(Boolean);
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map(u => [String(u._id), u]));
  
  const slotMap = new Map((teacher.timetable || []).map(s => [String(s._id), s]));
  
  // Also fetch Student records for correct studentId
  const students = await Student.find({ email: { $in: users.map(u => u.email) } });
  const studentMap = new Map(students.map(s => [s.email, s]));
  const rows = bookings.map(b => {
    const user = userMap.get(String(b.studentUserId)) || {};
    const student = studentMap.get(user.email) || {};
    const slot = slotMap.get(String(b.slotId)) || {};
    return {
      bookingId: b._id,
      studentName: user.name || '',
      studentEmail: user.email || '',
      studentId: student.studentId || '',
      day: slot.day || '',
      start: slot.start || '',
      end: slot.end || '',
      status: b.status,
      createdAt: b.createdAt ? b.createdAt.toISOString() : '',
      updatedAt: b.updatedAt ? b.updatedAt.toISOString() : '',
    };
  });
  const csv = Papa.unparse(rows);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="bookings-history.csv"');
  res.send(csv);
}
  
export async function uploadStudentsCsv(req, res) {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  const teacher = await Teacher.findOne({ email: req.user.email });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  
  let fileName = req.file.filename;
  let filePath = path.resolve(process.cwd(), '..', 'uploads', fileName);
  let csvText;
  try {
    csvText = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return res.status(500).json({ message: 'Failed to read uploaded file', error: e.message });
  }
  
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  if (!parsed.data || !Array.isArray(parsed.data) || parsed.data.length === 0) {
    return res.status(400).json({ message: 'CSV is empty or invalid' });
  }
  let added = 0, updated = 0, errors = [];
  for (const row of parsed.data) {
    const name = row.name?.trim();
    const email = row.email?.trim();
    const studentId = row.studentId?.trim();
    const password = row.password?.trim();
    if (!name || !email || !studentId || !password) {
      errors.push(`Missing fields in row: ${JSON.stringify(row)}`);
      continue;
    }
    let student = await Student.findOne({ studentId });
    if (!student) {
      try {
        student = await Student.create({ name, email, studentId, teacherIds: [teacher.teacherId] });
        added++;
      } catch (e) {
        errors.push(`Failed to create student ${studentId}: ${e.message}`);
        continue;
      }
    } else {
      if (!student.teacherIds.includes(teacher.teacherId)) {
        student.teacherIds.push(teacher.teacherId);
        await student.save();
        updated++;
      }
    }
    let user = await User.findOne({ email });
    if (!user) {
      try {
        const passwordHash = await bcrypt.hash(password, 10);
        user = await User.create({
          role: 'student',
          name,
          email,
          passwordHash,
          studentId,
          mustChangePassword: true
        });
      } catch (e) {
        errors.push(`Failed to create User for student ${studentId}: ${e.message}`);
      }
    } else {
      let changed = false;
      if (user.name !== name) { user.name = name; changed = true; }
      if (user.studentId !== studentId) { user.studentId = studentId; changed = true; }
      if (changed) await user.save();
    }
  }
  // Clean up uploaded file
  fs.unlink(filePath, () => {});
  res.json({ message: `Processed CSV: ${added} added, ${updated} updated, ${errors.length} errors`, errors });
}

const DEFAULT_TIMES = [
  ['08:00', '08:55'],
  ['08:55', '09:50'],
  ['10:10', '11:05'],
  ['11:05', '12:00'],
  ['12:00', '12:55'],
  ['12:55', '13:50'],
  ['14:10', '15:05'],
  ['15:05', '16:00'],
  ['16:00', '16:55'],
  ['16:55', '17:50'],
];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function dayToIndex(day) {
  const map = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
  return map[day] ?? -1;
}
function nowDayIndex() {
  return new Date().getDay(); // 0-6, 0=SUN
}
function nowHM() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
function timeLTE(a, b) { // 'HH:MM' <= 'HH:MM'
  return a.localeCompare(b) <= 0;
}

export async function resetPastSlotsForTeacher(teacher) {
  if (!teacher?.timetable) return;
  const todayIdx = nowDayIndex();
  const now = nowHM();
  let changed = false;
  // Find slots considered in the past relative to now
  for (const s of teacher.timetable) {
    const slotIdx = dayToIndex(s.day);
    if (slotIdx < 0) continue;
    const isPastDay = slotIdx >= 0 && slotIdx < todayIdx;
    const isPastToday = slotIdx === todayIdx && timeLTE(s.end, now);
    if (isPastDay || isPastToday) {
      if (s.currentBookings > 0 || (!s.initiallyBusy && s.status === 'occupied')) {
        // expire bookings linked to this slot
        await Booking.updateMany({ teacherId: teacher.teacherId, slotId: s._id, status: 'booked' }, { $set: { status: 'expired' } });
        s.currentBookings = 0;
        // Reset to available unless teacher marked this slot busy initially
        s.status = s.initiallyBusy ? 'available' : 'occupied';
        changed = true;
      }
    }
  }
  if (changed) await teacher.save();
}

export async function getMyTimetable(req, res) {
  const teacher = await Teacher.findOne({ email: req.user.email });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  if (!teacher.timetable || teacher.timetable.length === 0) {
    for (const day of DAYS) {
      for (const [start, end] of DEFAULT_TIMES) {
        teacher.timetable.push({ day, start, end, status: 'occupied', maxBookings: 5 });
      }
    }
    await teacher.save();
  }
  await resetPastSlotsForTeacher(teacher);
  // Normalize all slots to 'occupied' unless status is 'available'
  const normalized = (teacher.timetable || []).map(s => ({
    ...s.toObject(),
    status: s.status === 'available' ? 'available' : 'occupied'
  }));
  res.json({ timetable: normalized, mustSetup: teacher.mustSetupTimetable });
}

export async function upsertSlots(req, res) {
  const teacher = await Teacher.findOne({ email: req.user.email });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  const { slots } = req.body; // array of { day, start, end, status, maxBookings }
  // Merge by day+start+end
  const key = (s) => `${s.day}|${s.start}|${s.end}`;
  const map = new Map(teacher.timetable.map((s) => [key(s), s]));
  for (const s of slots || []) {
    const existing = map.get(key(s));
    if (existing) {
      existing.status = s.status ?? existing.status;
      existing.maxBookings = s.maxBookings ?? existing.maxBookings;
    } else {
  teacher.timetable.push({ day: s.day, start: s.start, end: s.end, status: s.status || 'occupied', maxBookings: s.maxBookings || 5 });
    }
  }
  await teacher.save();
  res.json({ timetable: teacher.timetable });
}

export async function setSlotStatus(req, res) {
  const { slotId, status, maxBookings } = req.body;
  const teacher = await Teacher.findOne({ email: req.user.email });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  const slot = teacher.timetable.id(slotId);
  if (!slot) return res.status(404).json({ message: 'Slot not found' });
  if (status) {
    return res.status(403).json({ message: 'Busy/free status cannot be changed here' });
  }
  if (typeof maxBookings === 'number') {
    if (slot.initiallyBusy) return res.status(400).json({ message: 'Cannot set limit on an initially busy slot' });
    if (maxBookings < 5) return res.status(400).json({ message: 'maxBookings must be >= 5' });
    slot.maxBookings = maxBookings;
  }
  await teacher.save();
  res.json({ slot });
}

export async function getBookings(req, res) {
  const teacher = await Teacher.findOne({ email: req.user.email });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  await resetPastSlotsForTeacher(teacher);
  const bookings = await Booking.find({ teacherId: teacher.teacherId, status: 'booked' });
  const withStudents = await Promise.all(
    bookings.map(async (b) => {
      const student = await User.findById(b.studentUserId).select('name email');
      return { ...b.toObject(), student };
    })
  );
  res.json({ bookings: withStudents });
}

// First-login setup: return default grid and current busy flags
export async function getSetupTimetable(req, res) {
  const teacher = await Teacher.findOne({ email: req.user.email });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  if (!teacher.timetable || teacher.timetable.length === 0) {
    for (const day of DAYS) {
      for (const [start, end] of DEFAULT_TIMES) {
        teacher.timetable.push({ day, start, end, status: 'occupied', maxBookings: 5 });
      }
    }
    await teacher.save();
  }
  await resetPastSlotsForTeacher(teacher);
  res.json({
    timetable: teacher.timetable.map((s) => ({ ...s.toObject(), initiallyBusy: s.status === 'occupied' })),
    mustSetup: teacher.mustSetupTimetable
  });
}

// Save initial busy selections only; limits cannot be set here
export async function saveSetupTimetable(req, res) {
  const teacher = await Teacher.findOne({ email: req.user.email });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  const { busyKeys } = req.body; // array of `${day}|${start}|${end}` to mark occupied
  const toKey = (s) => `${s.day}|${s.start}|${s.end}`;
  const setBusy = new Set(busyKeys || []);
  teacher.timetable.forEach((s) => {
    const busy = setBusy.has(toKey(s));
    s.status = busy ? 'occupied' : 'available';
    // mark initiallyBusy for reference
    s.initiallyBusy = busy;
  });
  teacher.mustSetupTimetable = false;
  await teacher.save();
  res.json({ ok: true, timetable: teacher.timetable });
}

// Daily Notes (venue + description per day)
export async function getDailyNotes(req, res) {
  const teacher = await Teacher.findOne({ email: req.user.email });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  if (!Array.isArray(teacher.dailyNotes)) teacher.dailyNotes = [];
  // Ensure all DAYS exist in the list (without duplicating)
  const existing = new Map((teacher.dailyNotes || []).map((n) => [n.day, n]));
  for (const d of DAYS) {
    if (!existing.has(d)) {
      teacher.dailyNotes.push({ day: d, venue: '', description: '' });
    }
  }
  await teacher.save();
  res.json({ notes: teacher.dailyNotes });
}

export async function saveDailyNotes(req, res) {
  const teacher = await Teacher.findOne({ email: req.user.email });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  const payload = req.body?.notes || req.body?.note || req.body;
  const arr = Array.isArray(payload) ? payload : [payload];
  const validDays = new Set(DAYS);
  if (!Array.isArray(teacher.dailyNotes)) teacher.dailyNotes = [];
  const byDay = new Map(teacher.dailyNotes.map((n) => [n.day, n]));
  for (const item of arr) {
    if (!item || !validDays.has(item.day)) continue;
    const current = byDay.get(item.day);
    if (current) {
      current.venue = item.venue ?? current.venue ?? '';
      current.description = item.description ?? current.description ?? '';
    } else {
      teacher.dailyNotes.push({ day: item.day, venue: item.venue || '', description: item.description || '' });
      byDay.set(item.day, teacher.dailyNotes[teacher.dailyNotes.length - 1]);
    }
  }
  await teacher.save();
  res.json({ notes: teacher.dailyNotes });
}
