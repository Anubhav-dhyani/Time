import { Teacher } from '../models/Teacher.js';
import { Booking } from '../models/Booking.js';
import { User } from '../models/User.js';

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
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

export async function getMyTimetable(req, res) {
  const teacher = await Teacher.findOne({ email: req.user.email });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  if (!teacher.timetable || teacher.timetable.length === 0) {
    for (const day of DAYS) {
      for (const [start, end] of DEFAULT_TIMES) {
    teacher.timetable.push({ day, start, end, status: 'available', maxBookings: 1 });
      }
    }
    await teacher.save();
  }
  res.json({ timetable: teacher.timetable, mustSetup: teacher.mustSetupTimetable });
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
      teacher.timetable.push({ day: s.day, start: s.start, end: s.end, status: s.status || 'available', maxBookings: s.maxBookings || 1 });
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
    if (maxBookings < 1) return res.status(400).json({ message: 'maxBookings must be >= 1' });
    slot.maxBookings = maxBookings;
  }
  await teacher.save();
  res.json({ slot });
}

export async function getBookings(req, res) {
  const teacher = await Teacher.findOne({ email: req.user.email });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
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
        teacher.timetable.push({ day, start, end, status: 'available', maxBookings: 1 });
      }
    }
    await teacher.save();
  }
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
