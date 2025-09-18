import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';
import Timetable from '../../shared/Timetable.jsx';

export default function StudentDashboard() {
  const { api, logout, user = {} } = useAuth();
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasBookedSlot, setHasBookedSlot] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [activeTab, setActiveTab] = useState('schedule');
  const [myBookings, setMyBookings] = useState([]);

  const load = async () => {
    try {
      const { data } = await api.get('/student/timetable');
      const tchs = data.teachers || [];
      setTeachers(tchs);
      try {
        const bookingsRes = await api.get('/student/my-bookings?details=1');
        setMyBookings(bookingsRes.data.bookings || []);
      } catch (err) {
        setMyBookings([]);
      }
      recomputeHasBooked(tchs, selectedTeacherId);
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
  const notes = currentTeacher?.notes || [];
  const dayIndex = (d) => ({ SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 })[d] ?? 7;
  const filledNotes = useMemo(() => {
    return (notes || [])
      .filter(n => (n?.venue && n.venue.trim().length) || (n?.description && n.description.trim().length))
      .sort((a, b) => dayIndex(a.day) - dayIndex(b.day));
  }, [notes]);

  const recomputeHasBooked = (list = teachers, tid = selectedTeacherId) => {
    const t = list.find(x => x.teacherId === tid);
    if (!t) return setHasBookedSlot(false);
    if (typeof t.hasBookedToday === 'boolean') {
      setHasBookedSlot(t.hasBookedToday);
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const booked = (t.timetable || []).some(slot => {
      if (!slot.startTime) return false;
      const dt = new Date(slot.startTime);
      return dt >= today && dt < new Date(today.getTime() + 24 * 60 * 60 * 1000) && slot.currentBookings > 0;
    });
    setHasBookedSlot(Boolean(booked));
  };

  const dayToIndex = (d) => ({ SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 })[d] ?? -1;
  const nowHM = () => {
    const dt = new Date();
    return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  };
  const timeLTE = (a, b) => String(a || '').localeCompare(String(b || '')) <= 0;

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
    if (isBooking) return;
    if (isPastSlot(slot)) {
      setErrorMessage('Cannot book a past time slot.');
      setShowError(true);
      return;
    }
    if (hasBookedSlot) {
      setErrorMessage("You already have a booking for today and cannot book another.");
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v11.494m-9-5.747h18"/>
                </svg>
              </div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-800">Student Portal</h1>
            </div>
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="User menu"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-50 border border-slate-200">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-semibold text-slate-800 truncate">{user?.name || 'Student'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Logout"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Welcome Message & Teacher Info */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 text-white shadow-lg">
          <h2 className="text-base sm:text-lg md:text-xl font-bold">Welcome, {user?.name || 'Student'}!</h2>
          <p className="mt-1 text-blue-100 text-xs sm:text-sm md:text-base">
            Your current teacher is <span className="font-semibold">{teacherName}</span>.
          </p>
          {hasBookedSlot && selectedTeacherId && (
            <p className="mt-2 text-xs sm:text-sm font-semibold bg-green-100 text-green-800 inline-block px-3 py-1 rounded-full">
              You have a booking with this teacher today.
            </p>
          )}
        </div>

        {/* Teacher Selection */}
        {teachers.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <select
              id="teacher-select"
              value={selectedTeacherId}
              onChange={e => {
                setSelectedTeacherId(e.target.value);
                recomputeHasBooked(teachers, e.target.value);
              }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select your teacher</option>
              {teachers.map(t => (
                <option key={t.teacherId} value={t.teacherId}>{t.teacherName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Prompt Message when No Teacher Selected */}
        {!selectedTeacherId && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 sm:p-6 text-center">
            <p className="text-sm sm:text-base text-slate-600">
              Please select your respective teacher to view their schedule and notes.
            </p>
          </div>
        )}

        {/* Tab Navigation (Shown only when a teacher is selected) */}
        {selectedTeacherId && (
          <div className="border-b border-slate-200 mb-4 sm:mb-6">
            <nav className="flex flex-wrap gap-2 sm:gap-4 -mb-px overflow-x-auto">
              <button
                className={`py-2 px-2 sm:px-3 font-semibold text-xs sm:text-sm md:text-base border-b-2 ${activeTab === 'schedule' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('schedule')}
                aria-label="View schedule"
              >
                Schedule
              </button>
              <button
                className={`py-2 px-2 sm:px-3 font-semibold text-xs sm:text-sm md:text-base border-b-2 ${activeTab === 'bookings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('bookings')}
                aria-label="View bookings"
              >
                My Bookings
              </button>
              <button
                className={`py-2 px-2 sm:px-3 font-semibold text-xs sm:text-sm md:text-base border-b-2 ${activeTab === 'notes' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                onClick={() => setActiveTab('notes')}
                aria-label="View daily notes"
              >
                Daily Notes
              </button>
            </nav>
          </div>
        )}

        {/* Tab Content (Shown only when a teacher is selected) */}
        {selectedTeacherId && activeTab === 'schedule' && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800">Schedule for {teacherName}</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">Click an available slot to book your session.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={load}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                  aria-label="Refresh schedule"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-slate-50/50">
              <Timetable
                slots={timetable}
                onBook={onBook}
                canBook={!hasBookedSlot && !isBooking}
                isPastSlot={isPastSlot}
              />
            </div>
          </div>
        )}

        {selectedTeacherId && activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800">My Bookings</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">A list of all your confirmed appointments.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={load}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                  aria-label="Refresh bookings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-slate-50/50 overflow-auto">
              {myBookings.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-slate-500">
                  <p className="text-sm sm:text-base">You have no bookings yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myBookings.map(b => {
                    const teacherName = b.teacherName || (teachers.find(t => t.teacherId === b.teacherId)?.teacherName) || 'N/A';
                    const slotDay = b.day || b.slot?.day;
                    const slotTime = `${b.start || b.slot?.start}-${b.end || b.slot?.end}`;
                    const status = b.status || b.slot?.status;
                    const notes = b.notes || (teachers.find(t => t.teacherId === b.teacherId)?.notes?.find(n => n.day === slotDay)) || {};
                    return (
                      <div key={b._id} className="border border-slate-200 rounded-lg p-4 w-full">
                        <p className="text-sm font-semibold text-slate-800">{teacherName}</p>
                        <p className="text-sm text-slate-700">{slotDay}, {slotTime}</p>
                        <p className="text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {status}
                          </span>
                        </p>
                        <div className="text-sm text-slate-600 mt-2">
                          {!(notes.venue?.trim() || notes.description?.trim()) ? (
                            <span className="text-slate-400">No notes</span>
                          ) : (
                            <div>
                              {notes.venue?.trim() && <p><span className="font-semibold">Venue:</span> {notes.venue}</p>}
                              {notes.description?.trim() && <p><span className="font-semibold">Note:</span> {notes.description}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTeacherId && activeTab === 'notes' && (
          <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800">Daily Notes from Teacher</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">Notes provided by {teacherName} for the week.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={load}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                  aria-label="Refresh notes"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-slate-50/50 overflow-auto">
              {filledNotes.length === 0 ? (
                <div className="text-center py-8 sm:py-12 text-slate-500">
                  <p className="text-sm sm:text-base">No notes available.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filledNotes.map((note) => (
                    <div key={note.day} className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/70 w-full">
                      <div className="text-sm sm:text-base font-bold text-blue-900 mb-2">{note.day}</div>
                      {note.venue?.trim() && (
                        <p className="text-xs sm:text-sm text-blue-800 mb-1"><span className="font-semibold">Venue:</span> {note.venue}</p>
                      )}
                      {note.description?.trim() && (
                        <p className="text-xs sm:text-sm text-blue-800">{note.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modals */}
        {(showConfirm || showError) && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full mx-2 sm:mx-4 shadow-2xl text-center">
              {showConfirm && (
                <>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 mb-2">Confirm Booking</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">Are you sure you want to book this slot? This action cannot be undone.</p>
                  <div className="flex justify-center gap-2 sm:gap-4">
                    <button
                      onClick={cancelBooking}
                      className="px-3 sm:px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition font-medium text-sm sm:text-base"
                      aria-label="Cancel booking"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmBooking}
                      className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm sm:text-base"
                      aria-label="Confirm booking"
                    >
                      Confirm
                    </button>
                  </div>
                </>
              )}
              {showError && (
                <>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-red-600 mb-2">Booking Error</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-6">{errorMessage}</p>
                  <button
                    onClick={closeError}
                    className="px-4 sm:px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm sm:text-base"
                    aria-label="Close error"
                  >
                    OK
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}