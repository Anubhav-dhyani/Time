import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';
import Timetable from '../../shared/Timetable.jsx';

export default function StudentDashboard() {
  const { api, logout, user } = useAuth();
  const [teachers, setTeachers] = useState([]);
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
      // Only set selectedTeacherId if not already set, or if current selection is no longer valid
      if ((!selectedTeacherId && tchs.length > 0) || (selectedTeacherId && !tchs.some(t => t.teacherId === selectedTeacherId))) {
        const fallback = data.teacherId || tchs[0].teacherId;
        setSelectedTeacherId(fallback);
        recomputeHasBooked(tchs, fallback);
      } else {
        recomputeHasBooked(tchs, selectedTeacherId);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setTeachers([]);
      setHasBookedSlot(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentTeacher = useMemo(() => teachers.find(t => t.teacherId === selectedTeacherId), [teachers, selectedTeacherId]);
  const teacherName = currentTeacher?.teacherName || 'Not assigned';
  const timetable = currentTeacher?.timetable || [];
  const notes = currentTeacher?.notes || [];
  const DAYS = ['MON','TUE','WED','THU','FRI','SAT'];
  const dayIndex = (d) => ({ SUN:0, MON:1, TUE:2, WED:3, THU:4, FRI:5, SAT:6 })[d] ?? 7;
  const filledNotes = useMemo(() => {
    return (notes || [])
      .filter(n => (n?.venue && n.venue.trim().length) || (n?.description && n.description.trim().length))
      .sort((a,b) => dayIndex(a.day) - dayIndex(b.day));
  }, [notes]);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* Professional Header */}
      <header className="bg-white shadow-lg border-b border-blue-100">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden mr-4 text-blue-700 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-blue-900">Student Dashboard</h1>
              <p className="text-blue-700 mt-1">Book your sessions with teachers</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-blue-900">Student: {user?.name || 'Student'}</p>
              <p className="text-sm font-semibold text-blue-900">Teacher: {teacherName}</p>
              {hasBookedSlot && (
                <p className="text-sm font-semibold text-green-600">You have booked a slot with this teacher today</p>
              )}
            </div>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition-colors duration-300 flex items-center shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-blue-100 px-6 py-4">
            <p className="text-blue-700 font-medium">Student: {user?.name || 'Student'}</p>
            <p className="text-blue-700 font-medium">Teacher: {teacherName}</p>
            {hasBookedSlot && (
              <p className="text-green-600 font-medium">You have booked a slot for today</p>
            )}
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {teachers.length > 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-blue-100">
            <label className="block text-sm font-bold text-blue-900 mb-3">Select Teacher</label>
            <select
              className="w-full md:w-80 p-4 border border-blue-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm"
              value={selectedTeacherId}
              onChange={(e) => { setSelectedTeacherId(e.target.value); recomputeHasBooked(teachers, e.target.value); }}
            >
              {teachers.map(t => (
                <option key={t.teacherId} value={t.teacherId}>{t.teacherName}</option>
              ))}
            </select>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-blue-100 transition-all duration-300 hover:shadow-xl">
          <div className="flex items-start">
            <div className="bg-blue-50 p-4 rounded-xl mr-5">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-blue-900 mb-2">Welcome, {user?.name || 'Student'}!</h2>
              <p className="text-gray-600">View and book available time slots with your teacher</p>
              {hasBookedSlot && (
                <p className="text-green-600 font-medium mt-2">You already have a booking with this teacher today. You cannot book another one.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-100">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-blue-900">Class Schedule - {teacherName}</h2>
                <p className="text-sm text-blue-700 mt-1">Click on available slots to book your session</p>
              </div>
              <button
                onClick={load}
                className="text-blue-600 hover:text-blue-800 transition-colors duration-300 flex items-center text-sm bg-white px-4 py-2 rounded-lg shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="overflow-x-auto">
              <Timetable
                slots={timetable}
                onBook={onBook}
                canBook={!hasBookedSlot && !isBooking}
                isPastSlot={isPastSlot}
              />
            </div>
            
            {/* Daily notes visible to students (only non-empty) */}
            {filledNotes.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Daily Notes</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filledNotes.map((note) => (
                    <div key={note.day} className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/50">
                      <div className="text-sm font-bold text-blue-900 mb-2">{note.day}</div>
                      {note.venue?.trim() && (
                        <div className="text-sm text-blue-800 mb-1"><span className="font-semibold">Venue:</span> {note.venue}</div>
                      )}
                      {note.description?.trim() && (
                        <div className="text-sm text-blue-800">{note.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-blue-800 font-medium">
                Book available time slots by clicking on them. Your teacher will be notified of your booking.
              </p>
              {hasBookedSlot && (
                <p className="text-green-700 font-medium mt-2">
                  You already have a booking with this teacher today. You cannot book another one.
                </p>
              )}
            </div>
          </div>
        </div>

        {showConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Confirm Booking</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to book this slot? Once booked, you cannot change it.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={cancelBooking}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors duration-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBooking}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-300 font-medium"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {showError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
              <h3 className="text-xl font-bold text-red-600 mb-4">Booking Error</h3>
              <p className="text-gray-600 mb-6">{errorMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={closeError}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors duration-300 font-medium"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-blue-200 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Student Portal • {new Date().getFullYear()} • 
              <span className="ml-2 text-gray-400">Book your learning sessions</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}