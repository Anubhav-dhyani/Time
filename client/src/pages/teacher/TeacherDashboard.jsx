import React, { useEffect, useState } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Timetable from '../../shared/Timetable.jsx';

export default function TeacherDashboard() {
  const { api, logout } = useAuth();
  const nav = useNavigate();
  const [timetable, setTimetable] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [mustSetup, setMustSetup] = useState(false);

  const load = async () => {
    const { data } = await api.get('/teacher/timetable');
    setTimetable(data.timetable);
    setMustSetup(data.mustSetup);
    const b = await api.get('/teacher/bookings');
    setBookings(b.data.bookings);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (mustSetup) nav('/teacher/setup');
  }, [mustSetup]);

  const onToggle = async (slot) => {
    const nextStatus = slot.status === 'available' ? 'occupied' : 'available';
    await api.post('/teacher/timetable/slot', { slotId: slot._id, status: nextStatus });
    await load();
  };

  // No limit changes here per requirement
  const onLimit = undefined;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Teacher Dashboard</h1>
        <div className="flex items-center gap-4">
          <button onClick={()=>nav('/change-password')} className="text-sm underline">Change password</button>
          <button onClick={()=>nav('/teacher/edit')} className="text-sm underline">Edit timetable</button>
          <button onClick={logout} className="text-sm underline">Logout</button>
        </div>
      </div>
  <Timetable slots={timetable} canBook={false} />
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-medium mb-2">Bookings</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Student</th>
                <th className="p-2">Email</th>
                <th className="p-2">Slot</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const slot = timetable.find((s) => s._id === b.slotId);
                return (
                  <tr key={b._id} className="border-t">
                    <td className="p-2">{b.student?.name || '-'}</td>
                    <td className="p-2">{b.student?.email || '-'}</td>
                    <td className="p-2">{slot ? `${slot.day} ${slot.start}-${slot.end}` : b.slotId}</td>
                    <td className="p-2">{b.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
