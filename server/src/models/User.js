import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  mustChangePassword: { type: Boolean, default: false },
    teacherId: { type: String }, // for students referencing assigned teacher
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
