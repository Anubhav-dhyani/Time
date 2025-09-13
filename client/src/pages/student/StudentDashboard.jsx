import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';
import Timetable from '../../shared/Timetable.jsx';

export default function StudentDashboard() {
  const { api, logout, user } = useAuth();
  const [teachers, setTeachers] = useState([]); // [{teacherId, teacherName, timetable}]
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasBookedSlot, setHasBookedSlot] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBooking, setIsBooking] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/student/timetable');
      const tchs = data.teachers || [];
      setTeachers(tchs);
      const fallback = data.teacherId || (tchs[0]?.teacherId ?? '');
      setSelectedTeacherId(fallback);
      // derive hasBookedSlot from API if provided; otherwise compute from bookings on timetable if available
      recomputeHasBooked(tchs, fallback);
    } catch (error) {
      console.error('Error loading data:', error);
      setTeachers([]);
      setHasBookedSlot(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const currentTeacher = useMemo(() => teachers.find(t => t.teacherId === selectedTeacherId), [teachers, selectedTeacherId]);
  const teacherName = currentTeacher?.teacherName || 'Not assigned';
  const timetable = currentTeacher?.timetable || [];

  const recomputeHasBooked = (list = teachers, tid = selectedTeacherId) => {
    const t = list.find(x => x.teacherId === tid);
    if (!t) return setHasBookedSlot(false);
    if (typeof t.hasBookedToday === 'boolean') {
      setHasBookedSlot(t.hasBookedToday);
      return;
    }
    const today = new Date();
    today.setHours(0,0,0,0);
    const booked = (t.timetable || []).some(slot => {
      if (!slot.startTime) return false;
      const dt = new Date(slot.startTime);
      return dt >= today && dt < new Date(today.getTime() + 24*60*60*1000) && slot.currentBookings > 0;
    });
    setHasBookedSlot(Boolean(booked));
  };

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

  const onBook = (slot) => {
    if (isBooking) {
      return;
    }

    if (isPastSlot(slot)) {
      setErrorMessage('Cannot book a past time slot.');
      setShowError(true);
      return;
    }

    if (hasBookedSlot) {
      setErrorMessage("You can't access to book slot again.");
      setShowError(true);
      return;
    }

    setSelectedSlot({ ...slot, teacherId: selectedTeacherId });
    setShowConfirm(true);
  };

  const confirmBooking = async () => {
    setShowConfirm(false);
    setIsBooking(true);
    try {
      await api.post('/student/book', { slotId: selectedSlot._id, teacherId: selectedTeacherId });
      await load();
      setSelectedSlot(null);
    } catch (error) {
      console.error('Error booking slot:', error);
      setErrorMessage(error.response?.data?.message || 'Error booking slot. Please try again.');
      setShowError(true);
      setSelectedSlot(null);
    } finally {
      setIsBooking(false);
    }
  };

  const cancelBooking = () => {
    setShowConfirm(false);
    setSelectedSlot(null);
  };

  const closeError = () => {
    setShowError(false);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
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
              <p className="text-sm font-medium text-blue-800">Student: {user?.name || 'Student'}</p>
              <p className="text-sm font-medium text-blue-800">Teacher: {teacherName}</p>
              {hasBookedSlot && (
                <p className="text-sm font-medium text-green-600">You have booked a slot for today</p>
              )}
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

        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-blue-100 px-4 py-3">
            <p className="text-blue-700">Student: {user?.name || 'Student'}</p>
            <p className="text-blue-700">Teacher: {teacherName}</p>
            {hasBookedSlot && (
              <p className="text-green-600">You have booked a slot for today</p>
            )}
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6">
        {teachers.length > 1 && (
          <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-blue-100">
            <label className="block text-sm font-medium text-blue-800 mb-2">Select Teacher</label>
            <select
              className="w-full md:w-80 p-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedTeacherId}
              onChange={(e) => { setSelectedTeacherId(e.target.value); recomputeHasBooked(teachers, e.target.value); }}
            >
              {teachers.map(t => (
                <option key={t.teacherId} value={t.teacherId}>{t.teacherName}</option>
              ))}
            </select>
          </div>
        )}
        <div className="bg-white rounded-xl shadow-md p-5 mb-6 border border-blue-100 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-800">Welcome, {user?.name || 'Student'}!</h2>
              <p className="text-gray-600 text-sm">View and book available time slots with your teacher</p>
              {hasBookedSlot && (
                <p className="text-green-600 text-sm mt-1">You have already booked a slot for today. You cannot book another one.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5 border border-blue-100">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-blue-800">Class Schedule - {teacherName}</h2>
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
            <Timetable
              slots={timetable}
              onBook={onBook}
              canBook={!hasBookedSlot && !isBooking}
              isPastSlot={isPastSlot}
            />
          </div>
        </div>

        <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-blue-700">
                Book available time slots by clicking on them. Your teacher will be notified of your booking.
              </p>
              {hasBookedSlot && (
                <p className="text-sm text-green-600 mt-1">
                  You have already booked a slot for today. You cannot book another one.
                </p>
              )}
            </div>
          </div>
        </div>

        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Confirm Booking</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to book this slot? Once booked, you cannot change it.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelBooking}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBooking}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {showError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Booking Error</h3>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={closeError}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-8 py-4 text-center text-sm text-gray-500 border-t border-blue-100 bg-white">
        <p>Student Portal • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}