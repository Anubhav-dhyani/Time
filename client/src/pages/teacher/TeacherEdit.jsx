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
      setSlots(data.timetable);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load timetable');
    }
  };
  
  useEffect(() => { load(); }, []);

  const setLimit = async (s) => {
    const v = prompt('Max bookings for this slot', s.maxBookings);
    if (!v) return;
    const n = parseInt(v, 10);
    if (Number.isNaN(n) || n < 1) return alert('Please enter a number greater than or equal to 1');
    await api.post('/teacher/timetable/slot', { slotId: s._id, maxBookings: n });
    await load();
  };

  const DAYS = ['MON','TUE','WED','THU','FRI'];
  const times = Array.from(new Set(slots.map((s)=>`${s.start}-${s.end}`))).sort();
  
  // For mobile view, show only one day at a time
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden mr-3 text-blue-700 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-blue-800">Edit Timetable</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => nav('/teacher')} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center"
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
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-blue-100">
          <div className="flex items-start">
            <div className="bg-blue-100 p-2 rounded-lg mr-4">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Edit Booking Limits</h2>
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
            <label htmlFor="day-select" className="block text-sm font-medium text-blue-800 mb-2">
              Select Day
            </label>
            <select
              id="day-select"
              className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className={`bg-white rounded-xl shadow-md p-4 md:p-6 border border-blue-100 ${isMobile ? 'hidden md:block' : 'block'}`}>
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
                  if (!s) return <div key={d} className="border-b border-blue-100 p-2 bg-blue-50"/>;
                  
                  const bg = s.status === 'occupied' 
                    ? 'bg-red-100 border-red-200' 
                    : 'bg-green-100 border-green-200';
                  
                  const textColor = s.status === 'occupied' 
                    ? 'text-red-800' 
                    : 'text-green-800';
                  
                  return (
                    <div key={d} className={`border-b border-blue-100 p-3 ${bg} text-sm space-y-2 transition-all duration-200 hover:shadow-md`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-medium ${textColor}`}>
                          {s.status === 'occupied' ? 'Busy' : 'Available'}
                        </span>
                        <span className="text-xs font-semibold bg-white px-2 py-1 rounded-full">
                          {s.currentBookings}/{s.maxBookings}
                        </span>
                      </div>
                      {s.status === 'available' && (
                        <button 
                          className="w-full px-3 py-2 text-xs bg-blue-600 text-white rounded-lg transition-colors duration-200 hover:bg-blue-700 font-medium flex items-center justify-center"
                          onClick={() => setLimit(s)}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Set Limit
                        </button>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Mobile List View */}
        {isMobile && (
          <div className="md:hidden space-y-4">
            {(selectedDay ? [selectedDay] : DAYS).map((d) => (
              <div key={d} className="bg-white rounded-xl shadow-md p-5 border border-blue-100">
                <h3 className="font-medium text-blue-800 text-center mb-4 text-lg">{d}</h3>
                <div className="space-y-3">
                  {slots
                    .filter(s => s.day === d)
                    .sort((a, b) => a.start.localeCompare(b.start))
                    .map((s) => {
                      const bg = s.status === 'occupied' 
                        ? 'bg-red-100 border-red-200' 
                        : 'bg-green-100 border-green-200';
                      
                      const textColor = s.status === 'occupied' 
                        ? 'text-red-800' 
                        : 'text-green-800';
                      
                      return (
                        <div key={s._id} className={`p-4 rounded-lg border ${bg} space-y-3`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{s.start} - {s.end}</span>
                            <span className={`text-xs font-medium ${textColor}`}>
                              {s.status === 'occupied' ? 'Busy' : 'Available'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">
                              Bookings: {s.currentBookings}/{s.maxBookings}
                            </span>
                            {s.status === 'available' && (
                              <button 
                                className="px-3 py-2 text-xs bg-blue-600 text-white rounded-lg transition-colors duration-200 hover:bg-blue-700 font-medium"
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
      <footer className="mt-8 py-4 text-center text-sm text-gray-500 border-t border-blue-100 bg-white">
        <p>Teacher Portal • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}