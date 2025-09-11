import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    day: { type: String, enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], required: true },
    start: { type: String, required: true }, // e.g., "08:00"
    end: { type: String, required: true },
    status: { type: String, enum: ['available', 'occupied'], default: 'available' },
    maxBookings: { type: Number, default: 1 },
    currentBookings: { type: Number, default: 0 },
  initiallyBusy: { type: Boolean, default: false },
  },
  { _id: true }
);

const teacherSchema = new mongoose.Schema(
  {
    teacherId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    timetable: [slotSchema],
  mustSetupTimetable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Teacher = mongoose.model('Teacher', teacherSchema);
