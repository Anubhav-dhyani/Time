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
  
  useEffect(() => {
    load();
    // Auto-refresh can be performance-intensive. Consider a manual refresh button instead.
    // const interval = setInterval(load, 5000); 
    // return () => clearInterval(interval);
  }, []);

  const setLimit = async (s) => {
    const v = prompt('Max bookings for this slot', s.maxBookings);
    if (!v) return;
    const n = parseInt(v, 10);
    if (Number.isNaN(n) || n < 5) return alert('Please enter a number greater than or equal to 5');
    await api.post('/teacher/timetable/slot', { slotId: s._id, maxBookings: n });
    await load();
  };

  const toggleAvailability = async (s) => {
    if (s.initiallyBusy) {
      alert('This slot is permanently busy and cannot be changed here.');
      return;
    }
    const next = s.status === 'available' ? 'occupied' : 'available';
    await api.post('/teacher/timetable/slot', { slotId: s._id, status: next });
    await load();
  };

  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const times = Array.from(new Set(slots.map((s) => `${s.start}-${s.end}`))).sort();
  const dayToIndex = (d) => ({ SUN:0, MON:1, TUE:2, WED:3, THU:4, FRI:5, SAT:6 })[d] ?? -1;
  const nowHM = () => {
    const dt = new Date();
    return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
  };
  const timeLTE = (a,b) => String(a || '').localeCompare(String(b || '')) <= 0;
  const isPastSlot = (slot) => {
    const si = dayToIndex(slot.day);
    if (si < 0) return false;
    const today = new Date().getDay();
    if (si < today) return true;
    if (si > today) return false;
    const end = slot.end || slot.start;
    return timeLTE(end, nowHM());
  };
  
  // For mobile view, show only one day at a time
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Professional Header */}
      <header className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden mr-4 text-red-700 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Edit Timetable</h1>
              <p className="text-gray-600 mt-1">Manage your schedule and booking limits</p>
            </div>
          </div>
          
          <button 
            onClick={() => nav('/teacher')} 
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition-colors duration-300 flex items-center shadow-lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Enhanced Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-start">
            <div className="bg-red-50 p-3 rounded-xl mr-5">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Edit Booking Limits</h2>
              <p className="text-gray-600">
                Set limits on slots that were initially free. Busy/free status can only be set during the initial setup flow.
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
        <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden ${isMobile ? 'hidden md:block' : 'block'}`}>
          <div className="overflow-x-auto">
            {/* Added table-fixed for equal column widths */}
            <table className="w-full table-fixed">
              <thead>
                <tr>
                  <th className="w-32 p-4 bg-gray-50 border-b border-gray-200 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                    Time
                  </th>
                  {DAYS.map((d) => (
                    <th key={d} className="p-4 bg-gray-50 border-b border-gray-200 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {times.map((t) => (
                  <tr key={t} className="hover:bg-gray-25 transition-colors duration-150">
                    <td className="p-4 text-sm font-medium text-gray-900 bg-gray-50">
                      {t.replace('-', ' - ')}
                    </td>
                    {DAYS.map((d) => {
                      const s = slots.find((x) => x.day === d && `${x.start}-${x.end}` === t);
                      if (!s) {
                        return (
                          <td key={d} className="p-2"></td> // Use p-2 to match content cells
                        );
                      }

                      const isPermanentBusy = Boolean(s.initiallyBusy);
                      const isBusy = s.status === 'occupied';
                      const past = isPastSlot(s);
                      const isBookingState = past && !isPermanentBusy;
                      const bg = isPermanentBusy
                        ? 'bg-red-600'
                        : (isBookingState ? 'bg-orange-100' : (isBusy ? 'bg-red-100' : 'bg-green-100'));
                      const textColor = isPermanentBusy ? 'text-white' : (isBookingState ? 'text-orange-800' : (isBusy ? 'text-red-800' : 'text-green-800'));
                      const statusText = isPermanentBusy ? 'Class' : (isBookingState ? 'Booking' : (isBusy ? 'Busy' : 'Available'));

                      return (
                        <td key={d} className="p-2 align-top"> {/* Use p-2 to give inner content space */}
                          {/* Flex container for equal height and content distribution */}
                          <div className={`${bg} rounded-xl p-3 text-center shadow-sm flex flex-col justify-between h-full min-h-[150px]`}>
                            {/* Top section: Status and bookings */}
                            <div>
                              <span className={`text-sm font-medium ${textColor}`}>
                                {statusText}
                              </span>
                              {(!isBusy || isBookingState) && (
                                <div className="mt-1 text-xs">
                                  {s.currentBookings}/{s.maxBookings} bookings
                                </div>
                              )}
                              {(isBusy && !isPermanentBusy) && (
                                <div className="mt-1 text-xs text-red-800">
                                  Max Booking - {s.maxBookings}
                                </div>
                              )}
                            </div>
                            
                            {/* Bottom section: Action buttons */}
                            <div>
                              {!isBookingState && (
                                <div className="mt-2 flex flex-col gap-1">
                                  {!isPermanentBusy && (
                                    <button 
                                      className="px-3 py-1 text-xs bg-white text-red-600 rounded-lg transition-colors duration-200 hover:bg-red-100 font-medium border border-gray-200"
                                      onClick={() => setLimit(s)}
                                    >
                                      Set Limit
                                    </button>
                                  )}
                                  {!isPermanentBusy && s.status === 'available' && (
                                    <button 
                                      className="px-3 py-1 text-xs bg-white text-red-600 rounded-lg transition-colors duration-200 hover:bg-red-100 font-medium border border-gray-200"
                                      onClick={() => toggleAvailability(s)}
                                    >
                                      Mark Busy
                                    </button>
                                  )}
                                  {!isPermanentBusy && s.status === 'occupied' && (
                                    <button 
                                      className="px-3 py-1 text-xs bg-white text-green-600 rounded-lg transition-colors duration-200 hover:bg-green-100 font-medium border border-gray-200"
                                      onClick={() => toggleAvailability(s)}
                                    >
                                      Mark Available
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile List View */}
        {isMobile && (
          <div className="md:hidden space-y-4">
            {(selectedDay ? [selectedDay] : DAYS).map((d) => (
              <div key={d} className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
                <h3 className="font-semibold text-gray-900 text-center mb-4 text-lg">{d}</h3>
                <div className="space-y-3">
                  {slots
                    .filter(s => s.day === d)
                    .sort((a, b) => a.start.localeCompare(b.start))
                    .map((s) => {
                      const isPermanentBusy = Boolean(s.initiallyBusy);
                      const isBusy = s.status === 'occupied';
                      const past = isPastSlot(s);
                      const isBookingState = past && !isPermanentBusy;
                      const bg = isPermanentBusy
                        ? 'bg-red-600'
                        : (isBookingState ? 'bg-orange-100' : (isBusy ? 'bg-red-100' : 'bg-green-100'));
                      const textColor = isPermanentBusy ? 'text-white' : (isBookingState ? 'text-orange-800' : (isBusy ? 'text-red-800' : 'text-green-800'));
                      
                      return (
                        <div key={s._id} className={`${bg} rounded-xl p-4 shadow-sm`}>
                          <div className="flex justify-between items-center">
                            <span className={`font-medium ${textColor}`}>
                              {s.start} - {s.end}
                            </span>
                            <span className={`text-sm font-medium ${textColor}`}>
                              {isPermanentBusy ? 'Class' : (isBookingState ? 'Booking' : (isBusy ? 'Busy' : 'Available'))}
                            </span>
                          </div>
                          <div className="text-xs mt-1">{s.currentBookings}/{s.maxBookings} bookings</div>
                          
                          {!isBookingState && !isPermanentBusy && (
                            <div className="mt-3 flex gap-2 justify-end">
                                <button 
                                  className="px-3 py-1 text-xs bg-white text-gray-700 rounded-lg transition-colors duration-200 hover:bg-gray-100 font-medium border border-gray-200"
                                  onClick={() => setLimit(s)}
                                >
                                  Set Limit
                                </button>
                                <button 
                                  className={`px-3 py-1 text-xs bg-white rounded-lg transition-colors duration-200 font-medium border border-gray-200 ${s.status === 'available' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                                  onClick={() => toggleAvailability(s)}
                                >
                                  {s.status === 'available' ? 'Mark Busy' : 'Mark Available'}
                                </button>
                            </div>
                          )}
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
      <footer className="mt-8 py-6 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
        <p>Teacher Portal • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}