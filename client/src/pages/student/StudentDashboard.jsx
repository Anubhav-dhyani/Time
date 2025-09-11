import React, { useEffect, useState } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';
import Timetable from '../../shared/Timetable.jsx';

export default function StudentDashboard() {
  const { api, logout } = useAuth();
  const [teacherId, setTeacherId] = useState('');
  const [timetable, setTimetable] = useState([]);

  const load = async () => {
    const { data } = await api.get('/student/timetable');
    setTeacherId(data.teacherId);
    setTimetable(data.timetable);
  };
  useEffect(() => { load(); }, []);

  const onBook = async (slot) => {
    await api.post('/student/book', { slotId: slot._id });
    await load();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Student Dashboard</h1>
        <div className="flex gap-4 items-center text-sm"><span>Teacher: {teacherId}</span><button onClick={logout} className="underline">Logout</button></div>
      </div>
      <Timetable slots={timetable} onBook={onBook} canBook />
    </div>
  );
}
