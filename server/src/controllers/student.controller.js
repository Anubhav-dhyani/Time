import { User } from '../models/User.js';
import { Teacher } from '../models/Teacher.js';
import { Booking } from '../models/Booking.js';

export async function getAssignedTimetable(req, res) {
  const me = await User.findById(req.user.id);
  if (!me?.teacherId) return res.status(400).json({ message: 'No teacher assigned' });
  const teacher = await Teacher.findOne({ teacherId: me.teacherId });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  res.json({ teacherId: teacher.teacherId, timetable: teacher.timetable });
}

export async function bookSlot(req, res) {
  const { slotId } = req.body;
  const me = await User.findById(req.user.id);
  if (!me?.teacherId) return res.status(400).json({ message: 'No teacher assigned' });
  const teacher = await Teacher.findOne({ teacherId: me.teacherId });
  if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
  const slot = teacher.timetable.id(slotId);
  if (!slot) return res.status(404).json({ message: 'Slot not found' });
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
}
