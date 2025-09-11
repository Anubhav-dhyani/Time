import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';

export async function login(req, res) {
  const { email, password, teacherId, identifier, expectedRole } = req.body;
  let lookupEmail = email || identifier;
  if (!lookupEmail && teacherId) lookupEmail = teacherId;

  // Support teacher login by teacherId (unique ID)
  if (lookupEmail && !String(lookupEmail).includes('@')) {
    const str = String(lookupEmail);
    const { Teacher } = await import('../models/Teacher.js');
    const { Student } = await import('../models/Student.js');
    const teacher = await Teacher.findOne({ teacherId: str });
    if (teacher) {
      lookupEmail = teacher.email;
    } else {
      const student = await Student.findOne({ studentId: str });
      if (student) lookupEmail = student.email;
    }
  }

  const user = await User.findOne({ email: lookupEmail });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
  if (expectedRole && expectedRole !== user.role) {
    return res.status(403).json({ message: 'Please use the correct portal for your role' });
  }
  const token = signToken(user);
  res.json({
    token,
    user: {
      id: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
      teacherId: user.teacherId,
      mustChangePassword: user.mustChangePassword || false
    }
  });
}

export async function registerStudent(req, res) {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: 'Email already in use' });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ role: 'student', name, email, passwordHash, mustChangePassword: true });
  const token = signToken(user);
  res.status(201).json({ token, user: { id: user._id, role: user.role, name: user.name, email: user.email, teacherId: user.teacherId } });
}

// Seed or ensure admin account from env on startup-like route
export async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await User.findOne({ email, role: 'admin' });
  if (existing) return;
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ role: 'admin', name: 'Admin', email, passwordHash });
  console.log('Admin user created from env');
}

// Student change password
export async function changePassword(req, res) {
  const authUserId = req.user?.id;
  const { userId: bodyUserId, oldPassword, currentPassword, newPassword } = req.body;
  const targetUserId = authUserId || bodyUserId;
  if (!targetUserId) return res.status(400).json({ message: 'Missing user' });
  const user = await User.findById(targetUserId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const old = oldPassword ?? currentPassword;
  const ok = await bcrypt.compare(old || '', user.passwordHash);
  if (!ok) return res.status(400).json({ message: 'Old password incorrect' });
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.mustChangePassword = false;
  await user.save();
  res.json({ message: 'Password changed successfully' });
}
