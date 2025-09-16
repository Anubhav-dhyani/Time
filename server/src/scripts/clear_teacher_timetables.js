// Script to clear all teacher timetables so they are recreated as 'busy' by default
import mongoose from 'mongoose';
import { Teacher } from '../models/Teacher.js';
import dotenv from 'dotenv';
dotenv.config({ path: 'src/.env' });

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const teachers = await Teacher.find();
  for (const teacher of teachers) {
    teacher.timetable = [];
    await teacher.save();
    console.log(`Cleared timetable for ${teacher.email}`);
  }
  await mongoose.disconnect();
  console.log('All teacher timetables cleared. They will be recreated as busy by default.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
