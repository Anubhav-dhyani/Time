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

- Teachers: name, [email], [password]
- Students: name, email, teacherId, [password]
