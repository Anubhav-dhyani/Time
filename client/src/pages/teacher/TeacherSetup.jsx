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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <svg className="animate-spin h-8 w-8 text-red-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600 font-medium">Loading timetable...</p>
        </div>
      </div>
    );
  }

  const timeToMinutes = (timeStr) => {
    const [start] = timeStr.split('-');
    const [hours, minutes] = start.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // In setup, display red-600 for permanently busy, light colors otherwise
  const normalizedSlots = slots.map(s => ({ ...s }));
  const times = Array.from(new Set(normalizedSlots.map((s) => `${s.start}-${s.end}`)))
    .map(t => ({ t, minutes: timeToMinutes(t) }))
    .sort((a, b) => a.minutes - b.minutes)
    .map(item => item.t);

  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Professional Header */}
      <header className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Set Your Availability</h1>
          <p className="text-gray-600 mt-1">Configure your teaching schedule</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-start">
            <div className="bg-red-50 p-3 rounded-xl mr-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Mark Your Available Times</h2>
              <p className="text-gray-600">
                All time slots are marked busy by default. Click to toggle slots to available as needed. Students will only be able to book available time slots.
                Limits can be set later from the edit timetable page.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Mobile Day Selector */}
        {isMobile && (
          <div className="mb-6 md:hidden">
            <label htmlFor="day-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Day
            </label>
            <select
              id="day-select"
              className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm"
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

        {/* Action Buttons */}
        <div className="flex justify-center mb-8">
          <button
            disabled={saving || slots.length === 0}
            onClick={save}
            className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-8 py-4 transition-colors duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Timetable
              </>
            )}
          </button>
        </div>

        {/* Compact Desktop Table */}
        <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden ${isMobile ? 'hidden md:block' : 'block'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-20 px-2 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Time
                  </th>
                  {DAYS.map((d) => (
                    <th key={d} className="px-2 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-[100px]">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {times.map((t, index) => (
                  <tr key={t} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                    <td className="px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 whitespace-nowrap">
                      {t.replace('-', '-')}
                    </td>
                    {DAYS.map((d) => {
                      const s = normalizedSlots.find((x) => x.day === d && `${x.start}-${x.end}` === t);
                      if (!s) {
                        return (
                          <td key={d} className="px-2 py-1.5"></td>
                        );
                      }

                      const busy = Boolean(s.initiallyBusy);
                      const bgColor = busy ? 'bg-red-600' : 'bg-red-100';
                      const textColor = busy ? 'text-white' : 'text-red-800';

                      return (
                        <td key={d} className="px-2 py-1.5">
                          <div 
                            className={`${bgColor} rounded px-2 py-1.5 text-center cursor-pointer transition-all hover:shadow-sm`} 
                            onClick={() => toggleBusy(s)}
                          >
                            <div className={`text-xs font-medium ${textColor} mb-0.5`}>
                              {busy ? 'Busy (Permanent)' : 'Not Busy'}
                            </div>
                            <button
                              className={`text-xs px-2 py-0.5 bg-white rounded transition-colors font-medium ${busy ? 'text-red-700 hover:bg-red-100' : 'text-red-700 hover:bg-red-100'}`}
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
          </div>
          {times.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No time slots found</h3>
              <p className="mt-1 text-sm text-gray-500">Please check your schedule data.</p>
            </div>
          )}
        </div>

        {/* Mobile Cards */}
        {isMobile && (
          <div className="md:hidden space-y-4 mb-8">
            {(selectedDay ? [selectedDay] : DAYS).map((d) => (
              <div key={d} className="bg-white rounded-2xl shadow-lg border border-gray-100">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-medium text-gray-900 text-center flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    {d}
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {normalizedSlots
                    .filter(s => s.day === d)
                    .sort((a, b) => timeToMinutes(`${a.start}-${a.end}`) - timeToMinutes(`${b.start}-${b.end}`))
                    .map((s) => {
                      const busy = Boolean(s.initiallyBusy);
                      const bgColor = busy ? 'bg-red-600' : 'bg-red-100';
                      const textColor = busy ? 'text-white' : 'text-red-800';

                      return (
                        <div key={s._id} className={`${bgColor} rounded-lg p-3 shadow-sm`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium text-gray-900">{s.start} - {s.end}</span>
                            <span className={`text-xs font-medium ${textColor}`}>
                              {busy ? 'Busy (Permanent)' : 'Not Busy'}
                            </span>
                          </div>
                          <button
                            className={`w-full px-3 py-2 text-xs bg-white rounded transition-colors font-medium ${busy ? 'text-red-700 hover:bg-red-100' : 'text-red-700 hover:bg-red-100'}`}
                            onClick={() => toggleBusy(s)}
                          >
                            {busy ? 'Mark Not Busy' : 'Mark Busy'}
                          </button>
                        </div>
                      );
                    })}
                </div>
                {slots.filter(s => s.day === d).length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No slots scheduled for {d}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Teacher Portal • {new Date().getFullYear()} • 
              <span className="ml-2 text-gray-400">Configure your availability</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 