// Get all bookings for the logged-in student, with slot, teacher, and notes details
export async function getMyBookings(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Find all bookings for this student
    const bookings = await Booking.find({ studentUserId: user._id }).lean();
    if (!bookings.length) return res.json({ bookings: [] });

    // Get all involved teachers
    const teacherIds = [...new Set(bookings.map(b => b.teacherId))];
    const teachers = await Teacher.find({ teacherId: { $in: teacherIds } }).lean();
    const teacherMap = Object.fromEntries(teachers.map(t => [t.teacherId, t]));

    // Build detailed booking info
    const detailed = bookings.map(b => {
      const teacher = teacherMap[b.teacherId];
      let slot = null;
      if (teacher && Array.isArray(teacher.timetable)) {
        slot = teacher.timetable.find(s => String(s._id) === String(b.slotId));
      }
      // Find daily notes for the slot's day
      let notes = {};
      if (teacher && Array.isArray(teacher.dailyNotes) && slot) {
        notes = teacher.dailyNotes.find(n => n.day === slot.day) || {};
      }
      return {
        _id: b._id,
        teacherId: b.teacherId,
        teacherName: teacher?.name || b.teacherId,
        slot: slot ? {
          day: slot.day,
          start: slot.start,
          end: slot.end,
          status: slot.status,
          initiallyBusy: slot.initiallyBusy,
          maxBookings: slot.maxBookings,
          currentBookings: slot.currentBookings,
        } : {},
        status: b.status,
        notes,
        createdAt: b.createdAt,
      };
    });
    res.json({ bookings: detailed });
  } catch (error) {
    console.error('Error in getMyBookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}
// Get assigned teachers for logged-in student
export async function getMyTeachers(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const student = await Student.findOne({ email: user.email });
    if (!student) return res.status(404).json({ message: 'Student record not found' });
    const teacherIds = (student.teacherIds || []).filter(Boolean);
    const teachers = await Teacher.find({ teacherId: { $in: teacherIds } }).select('teacherId name email');
    res.json({ teachers });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch teachers', error: e.message });
  }
}
import { User } from '../models/User.js';
import { Teacher } from '../models/Teacher.js';
import { Booking } from '../models/Booking.js';
import { resetPastSlotsForTeacher } from './teacher.controller.js';
import { Student } from '../models/Student.js';

function dayToIndex(day) {
  const map = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
  return map[day] ?? -1;
}
function nowDayIndex() { return new Date().getDay(); }
function nowHM() { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function timeLTE(a,b){ return a.localeCompare(b) <= 0; }
function isSlotInPast(slot){
  const si = dayToIndex(slot.day); const today = nowDayIndex(); const now = nowHM();
  if (si < today) return true;
  if (si > today) return false;
  return timeLTE(slot.end, now);
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

export async function getAssignedTimetable(req, res) {
  try {
    const user = await User.findById(req.user.id);
    const student = await Student.findOne({ email: user.email });
    let assignedIds = (student?.teacherIds || []).filter(Boolean);
    if (!assignedIds.length && user?.teacherId) {
      // Legacy fallback: user.teacherId may contain multiple IDs like "TCH101;TCH102"
      assignedIds = String(user.teacherId)
        .split(/[,;|\s]+/)
        .map((x) => x.trim())
        .filter(Boolean);
    }
    if (!assignedIds.length) return res.status(200).json({ teachers: [], timetable: [], teacherId: null, teacherName: 'Not assigned' });

    const teachers = await Teacher.find({ teacherId: { $in: assignedIds } });
    // Ensure we preserve order of assignedIds
    const teachersById = new Map(teachers.map((t) => [t.teacherId, t]));
    const ordered = assignedIds.map((id) => teachersById.get(id)).filter(Boolean);

    for (const t of ordered) {
      if (!t.timetable || t.timetable.length === 0) {
        for (const day of DAYS) {
          for (const [start, end] of DEFAULT_TIMES) {
            t.timetable.push({ day, start, end, status: 'occupied', maxBookings: 5 });
          }
        }
        await t.save();
      }
      await resetPastSlotsForTeacher(t);
    }

    // compute hasBookedToday for each teacher for this student
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const bookings = await Booking.find({
      studentUserId: user._id,
      teacherId: { $in: assignedIds },
      status: 'booked',
      createdAt: { $gte: todayStart, $lt: todayEnd },
    });
    const bookedSet = new Set(bookings.map((b) => b.teacherId));

    const response = ordered.map((t) => ({
      teacherId: t.teacherId,
      teacherName: t.name,
      timetable: t.timetable,
      notes: Array.isArray(t.dailyNotes) ? t.dailyNotes : [],
      hasBookedToday: bookedSet.has(t.teacherId),
    }));

    // Back-compat top-level fields for old UI (first teacher)
    const first = response[0];
    res.json({
      teachers: response,
      teacherId: first?.teacherId || null,
      teacherName: first?.teacherName || 'Not assigned',
      timetable: first?.timetable || [],
      notes: first?.notes || [],
      hasBookedToday: first?.hasBookedToday || false,
    });
  } catch (error) {
    console.error('Error in getAssignedTimetable:', error);
    res.status(500).json({ error: 'Failed to load timetable' });
  }
}

export async function bookSlot(req, res) {
  try {
    const { slotId, teacherId } = req.body;
    if (!teacherId) return res.status(400).json({ message: 'teacherId is required' });
    const me = await User.findById(req.user.id);
    const student = await Student.findOne({ email: me.email });
    let arr = (student?.teacherIds || []).filter(Boolean);
    if (!arr.length && me?.teacherId) {
      arr = String(me.teacherId)
        .split(/[,;|\s]+/)
        .map((x) => x.trim())
        .filter(Boolean);
    }
    const assigned = new Set(arr);
    if (!assigned.has(teacherId)) return res.status(403).json({ message: 'Not assigned to this teacher' });

    const teacher = await Teacher.findOne({ teacherId });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    await resetPastSlotsForTeacher(teacher);
    const slot = teacher.timetable.id(slotId);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    if (isSlotInPast(slot)) return res.status(400).json({ message: 'Slot time has passed' });
    if (slot.status !== 'available') return res.status(400).json({ message: 'Slot not available' });
    if (slot.currentBookings >= slot.maxBookings) return res.status(400).json({ message: 'Slot full' });

    // Check if already booked this specific slot by this student
    const existing = await Booking.findOne({ studentUserId: me._id, teacherId, slotId, status: 'booked' });
    if (existing) return res.status(400).json({ message: 'Already booked' });

    // Check if student has already booked any slot for today with this teacher (by createdAt)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const dailyBooking = await Booking.findOne({
      studentUserId: me._id,
      teacherId,
      createdAt: { $gte: todayStart, $lt: todayEnd },
      status: 'booked',
    });

    if (dailyBooking) {
      return res.status(400).json({ message: "You already have a booking with this teacher today." });
    }

  await Booking.create({ studentUserId: me._id, teacherId, slotId, status: 'booked' });
  slot.currentBookings += 1;
  teacher.markModified('timetable');
  await teacher.save();
  res.json({ message: 'Booked', slot });
  } catch (error) {
    console.error('Error in bookSlot:', error);
    res.status(500).json({ error: 'Failed to book slot' });
  }
}
