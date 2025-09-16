import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema(
  {
    day: { type: String, enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], required: true },
    start: { type: String, required: true }, // 
    end: { type: String, required: true },
    status: { type: String, enum: ['available', 'occupied'], default: 'occupied' },
    maxBookings: { type: Number, default: 5 },
    currentBookings: { type: Number, default: 0 },
    initiallyBusy: { type: Boolean, default: false },
  },
  { _id: true }
);

const dayNoteSchema = new mongoose.Schema(
  {
    day: { type: String, enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'], required: true },
    venue: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  { _id: false }
);

const teacherSchema = new mongoose.Schema(
  {
    teacherId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    timetable: [slotSchema],
    dailyNotes: [dayNoteSchema],
    mustSetupTimetable: { type: Boolean, default: true },
    setupAt: { type: Date },
    bookingWindowUntil: { type: Date },
    lastResetWeekStart: { type: Date },
  },
  { timestamps: true }
);

export const Teacher = mongoose.model('Teacher', teacherSchema);
