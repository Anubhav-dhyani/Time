import React, { useEffect, useState } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';

export default function TeacherSetup() {
  const { api } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/teacher/timetable/setup');
        setSlots(data.timetable);
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load');
      } finally { setLoading(false); }
    })();
  }, []);

  const key = (s) => `${s.day}|${s.start}|${s.end}`;
  const toggleBusy = (s) => {
    setSlots((prev) => prev.map((x) => x._id === s._id ? { ...x, status: x.status === 'occupied' ? 'available' : 'occupied' } : x));
  };

  const save = async () => {
    setSaving(true); setError('');
    try {
      const busyKeys = slots.filter((s) => s.status === 'occupied').map(key);
      await api.post('/teacher/timetable/setup', { busyKeys });
      window.location.href = '/teacher';
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-6">Loading…</div>;

  const DAYS = ['MON','TUE','WED','THU','FRI'];
  const times = Array.from(new Set(slots.map((s)=>`${s.start}-${s.end}`))).sort();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Set your busy times</h1>
      <p className="text-sm text-gray-600">Select the time slots when you're busy. Limits cannot be set here.</p>
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
                const busy = s.status === 'occupied';
                return (
                  <div key={d} className={`border p-2 ${busy? 'bg-slot-occupied text-white' : 'bg-slot-available'} text-sm`}>
                    <div className="flex justify-between mb-2">
                      <span>{busy? 'busy' : 'free'}</span>
                    </div>
                    <button className="px-2 py-1 text-xs bg-white/70 rounded" onClick={()=>toggleBusy(s)}>
                      {busy? 'Mark free' : 'Mark busy'}
                    </button>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button disabled={saving} onClick={save} className="bg-gray-900 text-white rounded px-4 py-2">{saving? 'Saving…' : 'Save timetable'}</button>
      </div>
    </div>
  );
}
