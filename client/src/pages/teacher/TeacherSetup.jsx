import React, { useEffect, useState } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function TeacherSetup() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/teacher/timetable/setup');
        setSlots(data.timetable || []);
      } catch (e) {
        console.error('Load error:', e);
        setError(e.response?.data?.message || 'Failed to load timetable');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const key = (s) => `${s.day}|${s.start}|${s.end}`;
  const toggleBusy = (s) => {
    setSlots((prev) =>
      prev.map((x) =>
        x._id === s._id
          ? { ...x, status: x.status === 'occupied' ? 'available' : 'occupied' }
          : x
      )
    );
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const busyKeys = slots.filter((s) => s.status === 'occupied').map(key);
      await api.post('/teacher/timetable/setup', { busyKeys });
      navigate('/teacher');
    } catch (e) {
      console.error('Save error:', e);
      setError(e.response?.data?.message || 'Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-3 text-gray-600">Loading timetable...</p>
        </div>
      </div>
    );
  }

  const timeToMinutes = (timeStr) => {
    const [start] = timeStr.split('-');
    const [hours, minutes] = start.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const times = Array.from(new Set(slots.map((s) => `${s.start}-${s.end}`)))
    .map(t => ({ t, minutes: timeToMinutes(t) }))
    .sort((a, b) => a.minutes - b.minutes)
    .map(item => item.t);

  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-xl md:text-2xl font-bold text-blue-800">Set Your Availability</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-blue-100">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-lg mr-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Mark Your Busy Times</h2>
              <p className="text-gray-600 text-sm">
                Select the time slots when you're busy. Students will only be able to book available time slots.
                Limits can be set later from the edit timetable page.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {isMobile && (
          <div className="mb-4 md:hidden">
            <label htmlFor="day-select" className="block text-sm font-medium text-blue-800 mb-2">
              Select Day
            </label>
            <select
              id="day-select"
              className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
            >
              <option value="">All Days</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        <div className={`bg-white rounded-xl shadow-md p-4 md:p-6 border border-blue-100 mb-6 ${isMobile ? 'hidden md:block' : 'block'}`}>
          <div className="grid" style={{ gridTemplateColumns: `120px repeat(${DAYS.length}, 1fr)` }}>
            <div className="font-medium p-2 border-b-2 border-blue-200 text-blue-800" />
            {DAYS.map((d) => (
              <div key={d} className="font-medium p-2 border-b-2 border-blue-200 text-blue-800 text-center">{d}</div>
            ))}
            {times.map((t) => (
              <React.Fragment key={t}>
                <div className="p-3 border-b border-blue-100 text-sm flex items-center justify-center bg-blue-50 text-blue-700 font-medium">
                  {t.replace('-', ' - ')}
                </div>
                {DAYS.map((d) => {
                  const s = slots.find((x) => x.day === d && `${x.start}-${x.end}` === t);
                  if (!s) {
                    return (
                      <div key={d} className="border-b border-blue-100 p-3 bg-gray-50 text-xs text-gray-500 text-center">
                        No slot
                      </div>
                    );
                  }

                  const busy = s.status === 'occupied';
                  const bg = busy ? 'bg-red-600 border-red-700' : 'bg-green-100 border-green-200';
                  const textColor = busy ? 'text-white' : 'text-green-800';

                  return (
                    <div key={d} className={`border-b border-blue-100 p-3 ${bg} text-sm space-y-2 transition-all duration-200 hover:shadow-md cursor-pointer`} onClick={() => toggleBusy(s)}>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-medium ${textColor}`}>
                          {busy ? 'Busy (Setup)' : 'Available'}
                        </span>
                      </div>
                      <button
                        className={`w-full px-3 py-2 text-xs bg-white rounded-lg transition-colors duration-200 font-medium ${busy ? 'text-red-700 hover:bg-red-100' : 'text-green-700 hover:bg-green-100'}`}
                        onClick={(e) => { e.stopPropagation(); toggleBusy(s); }}
                      >
                        {busy ? 'Mark as Available' : 'Mark as Busy'}
                      </button>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          {times.length === 0 && (
            <div className="text-center py-8 text-gray-500">No time slots available. Check your data.</div>
          )}
        </div>

        {isMobile && (
          <div className="md:hidden space-y-4 mb-6">
            {(selectedDay ? [selectedDay] : DAYS).map((d) => (
              <div key={d} className="bg-white rounded-xl shadow-md p-5 border border-blue-100">
                <h3 className="font-medium text-blue-800 text-center mb-4 text-lg">{d}</h3>
                <div className="space-y-3">
                  {slots
                    .filter(s => s.day === d)
                    .sort((a, b) => timeToMinutes(`${a.start}-${a.end}`) - timeToMinutes(`${b.start}-${b.end}`))
                    .map((s) => {
                      const busy = s.status === 'occupied';
                      const bg = busy ? 'bg-red-600 border-red-700' : 'bg-green-100 border-green-200';
                      const textColor = busy ? 'text-white' : 'text-green-800';

                      return (
                        <div key={s._id} className={`p-4 rounded-lg border ${bg} space-y-3`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{s.start} - {s.end}</span>
                            <span className={`text-xs font-medium ${textColor}`}>
                              {busy ? 'Busy (Setup)' : 'Available'}
                            </span>
                          </div>
                          <button
                            className={`w-full px-3 py-2 text-xs bg-white rounded-lg transition-colors duration-200 font-medium ${busy ? 'text-red-700 hover:bg-red-100' : 'text-green-700 hover:bg-green-100'}`}
                            onClick={() => toggleBusy(s)}
                          >
                            {busy ? 'Mark as Available' : 'Mark as Busy'}
                          </button>
                        </div>
                      );
                    })}
                </div>
                {slots.filter(s => s.day === d).length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">No slots for {d}</div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            disabled={saving || slots.length === 0}
            onClick={save}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 transition-colors duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Timetable
              </>
            )}
          </button>
        </div>
      </main>

      <footer className="mt-8 py-4 text-center text-sm text-gray-500 border-t border-blue-100 bg-white">
        <p>Teacher Portal • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}