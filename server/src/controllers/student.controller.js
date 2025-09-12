import { User } from '../models/User.js';
import { Teacher } from '../models/Teacher.js';
import { Booking } from '../models/Booking.js';
import { resetPastSlotsForTeacher } from './teacher.controller.js';

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

export async function getAssignedTimetable(req, res) {
  try {
    const me = await User.findById(req.user.id);
    if (!me?.teacherId) return res.status(400).json({ message: 'No teacher assigned' });
    
    const teacher = await Teacher.findOne({ teacherId: me.teacherId });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    
    await resetPastSlotsForTeacher(teacher);
    
    // Return teacher name along with teacherId and timetable
    res.json({ 
      teacherId: teacher.teacherId, 
      teacherName: teacher.name || 'Not Assigned', // Add teacher name here!
      timetable: teacher.timetable 
    });
  } catch (error) {
    console.error('Error in getAssignedTimetable:', error);
    res.status(500).json({ error: 'Failed to load timetable' });
  }
}

export async function bookSlot(req, res) {
  try {
    const { slotId } = req.body;
    const me = await User.findById(req.user.id);
    if (!me?.teacherId) return res.status(400).json({ message: 'No teacher assigned' });
    
    const teacher = await Teacher.findOne({ teacherId: me.teacherId });
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    
    await resetPastSlotsForTeacher(teacher);
    const slot = teacher.timetable.id(slotId);
    if (!slot) return res.status(404).json({ message: 'Slot not found' });
    if (isSlotInPast(slot)) return res.status(400).json({ message: 'Slot time has passed' });
    if (slot.status !== 'available') return res.status(400).json({ message: 'Slot not available' });
    if (slot.currentBookings >= slot.maxBookings) return res.status(400).json({ message: 'Slot full' });

    // Check if already booked by this student
    const existing = await Booking.findOne({ studentUserId: me._id, teacherId: teacher.teacherId, slotId, status: 'booked' });
    if (existing) return res.status(400).json({ message: 'Already booked' });

    await Booking.create({ studentUserId: me._id, teacherId: teacher.teacherId, slotId, status: 'booked' });
    slot.currentBookings += 1;
    if (slot.currentBookings >= slot.maxBookings) slot.status = 'occupied';
    await teacher.save();
    res.json({ message: 'Booked', slot });
  } catch (error) {
    console.error('Error in bookSlot:', error);
    res.status(500).json({ error: 'Failed to book slot' });
  }
}  