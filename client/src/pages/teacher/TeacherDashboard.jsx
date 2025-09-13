import React, { useEffect, useState } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import Timetable from '../../shared/Timetable.jsx';

export default function TeacherDashboard() {
  const { api, logout, user } = useAuth();
  const nav = useNavigate();
  const [timetable, setTimetable] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [mustSetup, setMustSetup] = useState(false);
  const [activeTab, setActiveTab] = useState('timetable');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/teacher/timetable');
      setTimetable(data.timetable);
      setMustSetup(data.mustSetup);
      const b = await api.get('/teacher/bookings');
      setBookings(b.data.bookings);
    } catch (error) {
      console.error('Error loading teacher data:', error);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (mustSetup) nav('/teacher/setup'); }, [mustSetup]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => nav('/teacher/setup')}
                className="text-red-600 hover:text-red-800 transition-colors duration-300 flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Setup Timetable
              </button>
              <button
                onClick={() => nav('/change-password')}
                className="text-red-600 hover:text-red-800 transition-colors duration-300 flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password
              </button>
              <button
                onClick={() => nav('/teacher/edit')}
                className="text-red-600 hover:text-red-800 transition-colors duration-300 flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Timetable
              </button>
            </div>
            <div className="relative">
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 px-4 py-3">
            <button
              onClick={() => { nav('/teacher/setup'); setIsMenuOpen(false); }}
              className="w-full text-left py-2 text-red-600 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Setup Timetable
            </button>
            <button
              onClick={() => { nav('/change-password'); setIsMenuOpen(false); }}
              className="w-full text-left py-2 text-red-600 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Change Password
            </button>
            <button
              onClick={() => { nav('/teacher/edit'); setIsMenuOpen(false); }}
              className="w-full text-left py-2 text-red-600 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Timetable
            </button>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-gray-200 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-lg mr-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Welcome, {user?.name || 'Teacher'}!</h2>
              <p className="text-gray-600 text-sm">Manage your timetable and view student bookings</p>
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-6 font-medium text-sm ${activeTab === 'timetable' ? 'text-white bg-red-800 border-b-2 border-red-900' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('timetable')}
          >
            Timetable
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm ${activeTab === 'bookings' ? 'text-white bg-red-800 border-b-2 border-red-900' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings ({bookings.length})
          </button>
        </div>

        {activeTab === 'timetable' && (
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Your Timetable</h2>
              <button
                onClick={load}
                className="text-red-600 hover:text-red-800 transition-colors duration-300 flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            <Timetable slots={timetable} canBook={false} />
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-gray-900">Student Bookings</h2>
              <button
                onClick={load}
                className="text-red-600 hover:text-red-800 transition-colors duration-300 flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            <div className="overflow-auto rounded-lg border border-gray-200">
              {bookings.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Student</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Slot</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.map((b) => {
                      const slot = timetable.find((s) => s._id === b.slotId);
                      return (
                        <tr key={b._id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{b.student?.name || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{b.student?.email || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {slot ? `${slot.day} ${slot.start}-${slot.end}` : b.slotId}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${b.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">No bookings yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-8 py-4 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
        <p>Teacher Portal • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}