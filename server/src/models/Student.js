import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    teacherId: { type: String, required: true },
  },
  { timestamps: true }
);

export const Student = mongoose.model('Student', studentSchema);
