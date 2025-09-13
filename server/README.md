# Timetable Backend

Express + MongoDB API for Admin/Teacher/Student with JWT.

Setup

1. Copy `.env.example` to `.env` and fill values.
2. Install deps.
3. Run dev server.

API Highlights

- POST /api/auth/login { email, password }
- POST /api/auth/register { name, email, password } (student)
- GET /api/auth/ensure-admin to auto-create admin from env
- Admin (Bearer token of admin):
  - POST /api/admin/upload/teachers file=form-data field `file` (.csv/.xlsx)
  - POST /api/admin/upload/students file=form-data field `file` (.csv/.xlsx)
  - GET /api/admin/users
  - POST /api/admin/link { studentEmail, teacherId }
- Teacher:
  - GET /api/teacher/timetable
  - POST /api/teacher/timetable/upsert  [{day, start, end, status, maxBookings}]
  - POST /api/teacher/timetable/slot { slotId, status, maxBookings }
  - GET /api/teacher/bookings
- Student:
  - GET /api/student/timetable
  - POST /api/student/book { slotId }

CSV Columns

- Teachers: name, [email], [password], [teacherId]
- Students: name, email, teacherIds, [studentId], [password]

Students CSV (multi-teacher)

- teacherIds: one or more teacher IDs separated by comma/semicolon/space/pipe. Example values: `T-1001`, `T-1001,T-1002`, `T-1001; T-1002; T-1003`
- studentId: optional; auto-generated if omitted.
- password: optional; auto-generated if omitted. Student will be prompted to change password on first login.

Example (CSV):

name,email,teacherIds,studentId,password
Alice Johnson,alice@example.com,"T-1001; T-2002",S-0001,Temp@123
Bob Singh,bob@example.com,T-3003,,

Behavior

- Each student can be linked to multiple teachers. On the student dashboard, the student can switch between assigned teachers and view each teacher's timetable separately.
- When booking, the student books against the currently selected teacher. Only one booking per day per teacher is allowed.
- Admin UI `Users` list shows for students a `studentTeacherIds` array in the API response; the legacy `teacherId` on user remains populated with the first assigned teacher for backward compatibility.
