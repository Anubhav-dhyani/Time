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
        // Use initiallyBusy from API; setup defines permanent busy flags only
        const normalized = (data.timetable || []).map(s => ({ ...s }));
        setSlots(normalized);
      } catch (e) {
        console.error('Load error:', e);
        setError(e.response?.data?.message || 'Failed to load timetable');
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  //hgchfxhtx

  const key = (s) => `${s.day}|${s.start}|${s.end}`;

  const toggleBusy = (s) => {
    setSlots((prev) => prev.map((x) => (x._id === s._id ? { ...x, initiallyBusy: !Boolean(x.initiallyBusy) } : x)));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const busyKeys = slots.filter((s) => Boolean(s.initiallyBusy)).map(key);
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <svg className="animate-spin h-8 w-8 text-red-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

  // In setup, display dark red for permanently busy, light red otherwise
  const normalizedSlots = slots.map(s => ({ ...s }));
  const times = Array.from(new Set(normalizedSlots.map((s) => `${s.start}-${s.end}`)))
    .map(t => ({ t, minutes: timeToMinutes(t) }))
    .sort((a, b) => a.minutes - b.minutes)
    .map(item => item.t);

  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Set Your Availability</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-gray-200">
          <div className="flex items-start">
            <div className="bg-red-100 p-2 rounded-lg mr-4">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Mark Your Available Times</h2>
              <p className="text-gray-600 text-sm">
                All time slots are marked busy by default. Click to toggle slots to available as needed. Students will only be able to book available time slots.
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
            <label htmlFor="day-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Day
            </label>
            <select
              id="day-select"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
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

        <div className={`bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-200 mb-6 ${isMobile ? 'hidden md:block' : 'block'}`}>
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-32 p-4 bg-gray-100 border-b-2 border-gray-300 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                  Time
                </th>
                {DAYS.map((d) => (
                  <th key={d} className="p-4 bg-gray-100 border-b-2 border-gray-300 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {times.map((t) => (
                <tr key={t} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="p-4 border-b border-gray-200 text-sm font-medium text-gray-900 bg-gray-50">
                    {t.replace('-', ' - ')}
                  </td>
                  {DAYS.map((d) => {
                    const s = normalizedSlots.find((x) => x.day === d && `${x.start}-${x.end}` === t);
                    if (!s) {
                      return (
                        <td key={d} className="p-4 border-b border-gray-200 bg-white"></td>
                      );
                    }

                    const busy = Boolean(s.initiallyBusy);
                    const bg = busy ? 'bg-red-800' : 'bg-red-100';
                    const textColor = busy ? 'text-white' : 'text-red-800';

                    return (
                      <td key={d} className="p-4 border-b border-gray-200">
                        <div 
                          className={`${bg} rounded-lg p-3 text-center shadow-sm cursor-pointer`} 
                          onClick={() => toggleBusy(s)}
                        >
                          <span className={`text-sm font-medium ${textColor}`}>
                            {busy ? 'Busy (Permanent)' : 'Not Busy'}
                          </span>
                          <button
                            className={`mt-2 px-3 py-1 text-xs bg-white rounded-md transition-colors duration-200 font-medium ${busy ? 'text-red-700 hover:bg-red-100' : 'text-red-700 hover:bg-red-100'}`}
                            onClick={(e) => { e.stopPropagation(); toggleBusy(s); }}
                          >
                            {busy ? 'Mark Not Busy' : 'Mark Busy'}
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {times.length === 0 && (
            <div className="text-center py-8 text-gray-500">No time slots available. Check your data.</div>
          )}
        </div>

        {isMobile && (
          <div className="md:hidden space-y-4 mb-6">
            {(selectedDay ? [selectedDay] : DAYS).map((d) => (
              <div key={d} className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-900 text-center mb-4 text-lg">{d}</h3>
                <div className="space-y-3">
                  {normalizedSlots
                    .filter(s => s.day === d)
                    .sort((a, b) => timeToMinutes(`${a.start}-${a.end}`) - timeToMinutes(`${b.start}-${b.end}`))
                    .map((s) => {
                      const busy = Boolean(s.initiallyBusy);
                      const bg = busy ? 'bg-red-800' : 'bg-red-100';
                      const textColor = busy ? 'text-white' : 'text-red-800';

                      return (
                        <div key={s._id} className={`${bg} rounded-lg p-4 shadow-sm`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">{s.start} - {s.end}</span>
                            <span className={`text-xs font-medium ${textColor}`}>
                              {busy ? 'Busy (Permanent)' : 'Not Busy'}
                            </span>
                          </div>
                          <button
                            className={`w-full mt-2 px-3 py-2 text-xs bg-white rounded-md transition-colors duration-200 font-medium ${busy ? 'text-red-700 hover:bg-red-100' : 'text-red-700 hover:bg-red-100'}`}
                            onClick={() => toggleBusy(s)}
                          >
                            {busy ? 'Mark Not Busy' : 'Mark Busy'}
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
            className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-6 py-3 transition-colors duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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

      <footer className="mt-8 py-4 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
        <p>Teacher Portal • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}