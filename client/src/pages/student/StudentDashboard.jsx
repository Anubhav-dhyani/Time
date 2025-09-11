import React, { useEffect, useState } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';
import Timetable from '../../shared/Timetable.jsx';

export default function StudentDashboard() {
  const { api, logout, user } = useAuth();
  const [teacherId, setTeacherId] = useState('');
  const [timetable, setTimetable] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const load = async () => {
    const { data } = await api.get('/student/timetable');
    setTeacherId(data.teacherId);
    setTimetable(data.timetable);
  };
  
  useEffect(() => { 
    load(); 
  }, []);

  const onBook = async (slot) => {
    await api.post('/student/book', { slotId: slot._id });
    await load();
  };

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
            <h1 className="text-xl md:text-2xl font-bold text-blue-800">Student Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-blue-800">Teacher: {teacherId || 'Not assigned'}</p>
            </div>
            <div className="relative">
              <button 
                onClick={logout} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-blue-100 px-4 py-3">
            <p className="text-blue-700">Teacher: {teacherId || 'Not assigned'}</p>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Welcome Card */}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-blue-100 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-800">Welcome, Student!</h2>
              <p className="text-gray-600 text-sm">View and book available time slots with your teacher</p>
            </div>
          </div>
        </div>

        {/* Timetable Section */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-blue-100">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-blue-800">Class Schedule</h2>
            <button 
              onClick={load}
              className="text-blue-600 hover:text-blue-800 transition-colors duration-300 flex items-center text-sm"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <Timetable slots={timetable} onBook={onBook} canBook />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700">
              Book available time slots by clicking on them. Your teacher will be notified of your booking.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-sm text-gray-500 border-t border-blue-100 bg-white">
        <p>Student Portal • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}