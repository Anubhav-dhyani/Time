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

  const onToggle = async (slot) => {
    const nextStatus = slot.status === 'available' ? 'occupied' : 'available';
    await api.post('/teacher/timetable/slot', { slotId: slot._id, status: nextStatus });
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
            <h1 className="text-xl md:text-2xl font-bold text-blue-800">Teacher Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3">
              <button 
                onClick={() => nav('/change-password')} 
                className="text-blue-600 hover:text-blue-800 transition-colors duration-300 flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password
              </button>
              <button 
                onClick={() => nav('/teacher/edit')} 
                className="text-blue-600 hover:text-blue-800 transition-colors duration-300 flex items-center text-sm"
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
            <button 
              onClick={() => { nav('/change-password'); setIsMenuOpen(false); }} 
              className="w-full text-left py-2 text-blue-600 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Change Password
            </button>
            <button 
              onClick={() => { nav('/teacher/edit'); setIsMenuOpen(false); }} 
              className="w-full text-left py-2 text-blue-600 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Timetable
            </button>
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
              <h2 className="text-lg font-semibold text-blue-800">Welcome, {user?.name || 'Teacher'}!</h2>
              <p className="text-gray-600 text-sm">Manage your timetable and view student bookings</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-blue-200 mb-6">
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'timetable' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
            onClick={() => setActiveTab('timetable')}
          >
            Timetable
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'bookings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings ({bookings.length})
          </button>
        </div>

        {/* Timetable Section */}
        {activeTab === 'timetable' && (
          <div className="bg-white rounded-xl shadow-md p-5 border border-blue-100 mb-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-blue-800">Your Timetable</h2>
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
              <Timetable slots={timetable} onToggle={onToggle} canBook={false} />
            </div>
          </div>
        )}

        {/* Bookings Section */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-md p-5 border border-blue-100">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-blue-800">Student Bookings</h2>
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
            
            <div className="overflow-auto rounded-lg border border-blue-100">
              {bookings.length > 0 ? (
                <table className="min-w-full divide-y divide-blue-100">
                  <thead className="bg-blue-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Student</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Slot</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-100">
                    {bookings.map((b) => {
                      const slot = timetable.find((s) => s._id === b.slotId);
                      return (
                        <tr key={b._id} className="hover:bg-blue-50 transition-colors duration-150">
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

      {/* Footer */}
      <footer className="mt-8 py-4 text-center text-sm text-gray-500 border-t border-blue-100 bg-white">
        <p>Teacher Portal • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}