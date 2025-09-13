import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Support multiple assigned teachers per student
    teacherIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Student = mongoose.model('Student', studentSchema);
