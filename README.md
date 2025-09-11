# MERN Timetable App

This workspace contains:

- `server`: Express + MongoDB API with JWT auth and role-based features.
- `client`: React + Tailwind UI for Admin, Teacher, Student.

Quickstart

1. Server
   - Copy `server/.env.example` to `server/.env` and fill values.
   - Install deps: run npm install in `server`.
   - Optionally start MongoDB via Docker: `docker compose up -d` (requires Docker Desktop).
   - Start dev API on port 4000.
   - Call `GET /api/auth/ensure-admin` once to create the admin from env.

2. Client
   - In `client`, create `.env` with `VITE_API_URL=http://localhost:4000/api`.
   - Install deps and run `npm run dev`.

CSV Templates

- Teachers: columns name, [email], [password]
- Students: columns name, email, teacherId, [password]

Timetable

- Teachers can toggle slots and set limits; students can book available ones.

PowerShell quick run

```powershell
# Start Mongo (optional if you have a local instance)
docker compose up -d

# Backend
cd server; npm run dev

# Frontend (in another terminal)
cd client; npm run dev
```
