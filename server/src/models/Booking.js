import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    studentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    teacherId: { type: String, required: true, index: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: { type: String, enum: ['booked', 'cancelled', 'expired'], default: 'booked' },
  },
  { timestamps: true }
);

bookingSchema.index({ teacherId: 1, slotId: 1, status: 1 });

export const Booking = mongoose.model('Booking', bookingSchema);
