import React, { useEffect, useState } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';

export default function TeacherEdit() {
  const { api } = useAuth();
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/teacher/timetable');
      setSlots(data.timetable);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load');
    }
  };
  useEffect(() => { load(); }, []);

  const setLimit = async (s) => {
    const v = prompt('Max bookings for this slot', s.maxBookings);
    if (!v) return;
    const n = parseInt(v, 10);
    if (Number.isNaN(n) || n < 1) return alert('Enter a number >= 1');
    await api.post('/teacher/timetable/slot', { slotId: s._id, maxBookings: n });
    await load();
  };

  const DAYS = ['MON','TUE','WED','THU','FRI'];
  const times = Array.from(new Set(slots.map((s)=>`${s.start}-${s.end}`))).sort();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Edit Timetable</h1>
  <p className="text-sm text-gray-600">Set limits on slots that were initially free. Busy/free can only be set during the setup flow.</p>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="bg-white p-4 rounded shadow overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: `120px repeat(${DAYS.length}, 1fr)` }}>
          <div />
          {DAYS.map((d)=>(<div key={d} className="font-medium p-2 border text-center">{d}</div>))}
          {times.map((t)=> (
            <React.Fragment key={t}>
              <div className="p-2 border text-sm flex items-center">{t}</div>
              {DAYS.map((d)=>{
                const s = slots.find((x)=>x.day===d && `${x.start}-${x.end}`===t);
                if(!s) return <div key={d} className="border p-2 bg-gray-100"/>;
                const bg = s.status === 'occupied' ? 'bg-slot-occupied text-white' : 'bg-slot-available';
                return (
                  <div key={d} className={`border p-2 ${bg} text-sm space-y-2`}>
                    <div className="flex justify-between">
                      <span>{s.status}</span>
                      <span>{s.currentBookings}/{s.maxBookings}</span>
                    </div>
                    {s.status === 'available' && (
                      <button className="px-2 py-1 text-xs bg-white/70 rounded" onClick={()=>setLimit(s)}>Set limit</button>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
