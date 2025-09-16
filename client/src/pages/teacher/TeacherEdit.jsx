import React, { useEffect, useState } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function TeacherEdit() {
  const { api } = useAuth();
  const nav = useNavigate();
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get('/teacher/timetable');
      // Normalize maxBookings to 5 if missing or less than 5
      const normalized = (data.timetable || []).map(s => ({
        ...s,
        maxBookings: !s.maxBookings || s.maxBookings < 5 ? 5 : s.maxBookings
      }));
      setSlots(normalized);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load timetable');
    }
  };
  
  useEffect(() => { load(); }, []);

  const setLimit = async (s) => {
    const v = prompt('Max bookings for this slot', s.maxBookings);
    if (!v) return;
    const n = parseInt(v, 10);
    if (Number.isNaN(n) || n < 5) return alert('Please enter a number greater than or equal to 5');
    await api.post('/teacher/timetable/slot', { slotId: s._id, maxBookings: n });
    await load();
  };

  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const times = Array.from(new Set(slots.map((s) => `${s.start}-${s.end}`))).sort();
  
  // For mobile view, show only one day at a time
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden mr-3 text-red-700 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Edit Timetable</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => nav('/teacher')} 
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-gray-200">
          <div className="flex items-start">
            <div className="bg-red-100 p-2 rounded-lg mr-4">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Edit Booking Limits</h2>
              <p className="text-gray-600 text-sm">
                Set limits on slots that were initially free. Busy/free status can only be set during the initial setup flow.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Mobile Day Selector */}
        {isMobile && (
          <div className="mb-4 md:hidden">
            <label htmlFor="day-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Day
            </label>
            <select
              id="day-select"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={selectedDay || ''}
              onChange={(e) => setSelectedDay(e.target.value)}
            >
              <option value="">All Days</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}

        {/* Desktop Grid View */}
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
                    const s = slots.find((x) => x.day === d && `${x.start}-${x.end}` === t);
                    if (!s) {
                      return (
                        <td key={d} className="p-4 border-b border-gray-200 bg-white"></td>
                      );
                    }

                    const bg = s.status === 'occupied' 
                      ? 'bg-red-800' 
                      : 'bg-green-100';
                    
                    return (
                      <td key={d} className="p-4 border-b border-gray-200">
                        <div className={`${bg} rounded-lg p-3 text-center shadow-sm ${s.status === 'occupied' ? 'text-white' : ''}`}>
                          <span className={`text-sm font-medium ${s.status === 'occupied' ? '' : 'text-green-800'}`}>
                            {s.status === 'occupied' ? 'Busy' : 'Available'}
                          </span>
                          <div className="mt-1 text-xs">
                            {s.currentBookings}/{s.maxBookings} bookings
                          </div>
                          {s.status === 'available' && (
                            <button 
                              className="mt-2 px-3 py-1 text-xs bg-white text-red-600 rounded-md transition-colors duration-200 hover:bg-red-100 font-medium"
                              onClick={() => setLimit(s)}
                            >
                              Set Limit
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        {isMobile && (
          <div className="md:hidden space-y-4">
            {(selectedDay ? [selectedDay] : DAYS).map((d) => (
              <div key={d} className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
                <h3 className="font-semibold text-gray-900 text-center mb-4 text-lg">{d}</h3>
                <div className="space-y-3">
                  {slots
                    .filter(s => s.day === d)
                    .sort((a, b) => a.start.localeCompare(b.start))
                    .map((s) => {
                      const bg = s.status === 'occupied' 
                        ? 'bg-red-800' 
                        : 'bg-green-100';
                      
                      return (
                        <div key={s._id} className={`${bg} rounded-lg p-4 shadow-sm ${s.status === 'occupied' ? 'text-white' : ''}`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">
                              {s.start} - {s.end}
                            </span>
                            <span className={`text-xs font-medium ${s.status === 'occupied' ? '' : 'text-green-800'}`}>
                              {s.status === 'occupied' ? 'Busy' : 'Available'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm">
                              {s.currentBookings}/{s.maxBookings} bookings
                            </span>
                            {s.status === 'available' && (
                              <button 
                                className="px-3 py-1 text-xs bg-white text-red-600 rounded-md transition-colors duration-200 hover:bg-red-100 font-medium"
                                onClick={() => setLimit(s)}
                              >
                                Set Limit
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
        <p>Teacher Portal • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}