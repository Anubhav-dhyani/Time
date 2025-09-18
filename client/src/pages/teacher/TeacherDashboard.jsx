import React, { useEffect, useState } from 'react';

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-xl shadow-xl p-8 w-full max-w-md z-10 animate-fade-in">
        {children}
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl">×</button>
      </div>
    </div>
  );
}
import { useAuth } from '../../state/AuthContext.jsx';
import TeacherHeader from '../../shared/TeacherHeader.jsx';
import { useNavigate } from 'react-router-dom';
import Timetable from '../../shared/Timetable.jsx';

function sortStudents(students, asc = true) {
  return [...students].sort((a, b) => {
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    if (nameA < nameB) return asc ? -1 : 1;
    if (nameA > nameB) return asc ? 1 : -1;
    return 0;
  });
}

export default function TeacherDashboard() {
  // Load dashboard data (timetable, bookings, students, notes)
  const load = async () => {
    try {
      const [tt, bk, st, nt] = await Promise.all([
        api.get('/teacher/timetable'),
        api.get('/teacher/bookings'),
        api.get('/teacher/students'),
        api.get('/teacher/daily-notes'),
      ]);
      setTimetable(tt.data.timetable || []);
      setBookings(bk.data.bookings || []);
      setStudents(st.data.students || []);
      setNotes(nt.data.notes || []);
    } catch (e) {
      // Optionally handle error
    }
  };

  useEffect(() => {
    load();
  }, []);
  const { api } = useAuth();
  const nav = useNavigate();
  const [timetable, setTimetable] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [mustSetup, setMustSetup] = useState(false);
  const [activeTab, setActiveTab] = useState('timetable');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notes, setNotes] = useState([]);
  const [students, setStudents] = useState([]);
  const [sortAsc, setSortAsc] = useState(true);
  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // CSV upload state
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvUploadMsg, setCsvUploadMsg] = useState('');

  // Modal state for single student add
  const [modal, setModal] = useState({ open: false, form: {} });

  // CSV download error state
  const [csvDownloadError, setCsvDownloadError] = useState('');

  // Handle CSV upload
  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvUploading(true);
    setCsvUploadMsg('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/teacher/upload-students', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCsvUploadMsg(res.data?.message || 'Upload successful!');
      await load();
    } catch (err) {
      setCsvUploadMsg(err.response?.data?.message || 'Upload failed');
    }
    setCsvUploading(false);
  };

  useEffect(() => {
    if (mustSetup) nav('/teacher/setup');
  }, [mustSetup, nav]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'timetable' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('timetable')}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Timetable
                </div>
              </button>
              <button
                className="py-3 px-6 text-sm font-medium border-b-2 transition-colors duration-200"
                onClick={() => nav('/teacher/edit')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Timetable
              </button>
              <button
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'bookings' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('bookings')}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 01-3 0m3 0H9m1.5-9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                    />
                  </svg>
                  Bookings
                  {bookings.length > 0 && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{bookings.length}</span>
                  )}
                </div>
              </button>
              <button
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'students' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('students')}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M17 8a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Student List
                </div>
              </button>
              <button
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'notes' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('notes')}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Daily Notes
                </div>
              </button>
              <button
                className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  activeTab === 'student-management' ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('student-management')}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Student Management
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4 transition-all duration-300 ease-in-out">
            {activeTab === 'timetable' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Your Timetable</h2>
                  <button
                    onClick={load}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {timetable.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Timetable
                        slots={timetable.map((s) => ({
                          ...s,
                          statusText: Boolean(s.initiallyBusy) ? 'Class' : s.status === 'occupied' ? 'Booked' : 'Available',
                          bgColor: Boolean(s.initiallyBusy) ? 'bg-red-600' : s.status === 'occupied' ? 'bg-red-100' : 'bg-green-50',
                          textColor: Boolean(s.initiallyBusy) ? 'text-white' : s.status === 'occupied' ? 'text-red-800' : 'text-green-700',
                          fontSize: 'text-lg', // Increased font size for status text
                        }))}
                        canBook={false}
                        isPastSlot={isPastSlot}
                        className="max-w-full" // Ensure timetable fits screen
                      />
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No timetable set</h3>
                      <p className="mt-1 text-sm text-gray-500">Please set up your timetable in the Setup page.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'bookings' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Student Bookings</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={load}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                    <button
                      onClick={async () => {
                        setCsvDownloadError('');
                        try {
                          const res = await api.get('/teacher/bookings-csv', { responseType: 'blob' });
                          if (res.data && res.data.type && res.data.type !== 'text/csv') {
                            const text = await res.data.text();
                            setCsvDownloadError(text || 'Failed to download CSV');
                            return;
                          }
                          const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', 'bookings-history.csv');
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        } catch (e) {
                          let msg = 'Failed to download CSV';
                          if (e.response && e.response.data) {
                            if (e.response.data instanceof Blob) {
                              try {
                                msg = await e.response.data.text();
                              } catch {}
                            } else if (typeof e.response.data === 'string') {
                              msg = e.response.data;
                            } else if (e.response.data.message) {
                              msg = e.response.data.message;
                            }
                          }
                          setCsvDownloadError(msg);
                        }
                      }}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export CSV
                    </button>
                  </div>
                </div>

                {csvDownloadError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 transition-opacity duration-200">{csvDownloadError}</div>
                )}

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {bookings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Slot</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {bookings.map((b) => {
                            const slot = timetable.find((s) => s._id === b.slotId);
                            return (
                              <tr key={b._id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{b.student?.name || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-600">{b.student?.email || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{slot ? `${slot.day} ${slot.start}-${slot.end}` : b.slotId}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                      b.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {b.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Students haven't booked any slots yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Student List</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={load}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                    <button
                      onClick={() => setSortAsc(!sortAsc)}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                      Sort {sortAsc ? 'Descending' : 'Ascending'}
                    </button>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {students.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {sortStudents(students, sortAsc).map((s) => (
                            <tr key={s.email} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{s.name || '-'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{s.email || '-'}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87M17 8a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No students assigned</h3>
                      <p className="mt-1 text-sm text-gray-500">Upload a student list or check back later.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Daily Notes</h2>
                  <button
                    onClick={async () => {
                      try {
                        await api.post('/teacher/daily-notes', { notes });
                        const n = await api.get('/teacher/daily-notes');
                        setNotes(n.data.notes || []);
                      } catch (e) {
                        console.error('Failed saving notes', e);
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Notes
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {DAYS.map((d) => {
                    const idx = (notes || []).findIndex((n) => n.day === d);
                    const note = idx >= 0 ? notes[idx] : { day: d, venue: '', description: '' };
                    return (
                      <div key={d} className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-shadow duration-200 hover:shadow-md">
                        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          {d}
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                            <input
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
                              value={note.venue}
                              onChange={(e) => {
                                const updated = [...(notes || [])];
                                if (idx >= 0) updated[idx] = { ...note, venue: e.target.value };
                                else updated.push({ ...note, venue: e.target.value });
                                setNotes(updated);
                              }}
                              placeholder="e.g., Room 210, Lab 3, Main Hall"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-150"
                              rows={3}
                              value={note.description}
                              onChange={(e) => {
                                const updated = [...(notes || [])];
                                if (idx >= 0) updated[idx] = { ...note, description: e.target.value };
                                else updated.push({ ...note, description: e.target.value });
                                setNotes(updated);
                              }}
                              placeholder="Additional notes for students..."
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'student-management' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Management</h2>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Upload Students CSV:</label>
                  <div className="flex-1 flex items-center gap-3">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      disabled={csvUploading}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors duration-150"
                    />
                    {csvUploading && <span className="text-blue-600 text-sm animate-pulse">Uploading...</span>}
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full mb-2 bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-100 transition-colors duration-200"
                  onClick={() => setModal({ open: true, form: {} })}
                >
                  Add Single Student
                </button>
                {csvUploadMsg && (
                  <div
                    className={`text-sm p-3 rounded-md transition-opacity duration-200 ${
                      csvUploadMsg.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {csvUploadMsg}
                  </div>
                )}
                {/* Modal for single student add */}
                <Modal open={modal?.open} onClose={() => setModal({ open: false, form: {} })}>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const { name, email, password, studentId } = modal.form || {};
                      if (!name || !email || !password || !studentId) return;
                      try {
                        // Create a CSV string for a single student
                        const csv = `name,email,password,studentId\n"${name}","${email}","${password}","${studentId}"`;
                        const formData = new FormData();
                        formData.append('file', new Blob([csv], { type: 'text/csv' }), 'single-student.csv');
                        const { data } = await api.post('/teacher/upload-students', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                        setCsvUploadMsg(data?.message || 'Student added!');
                        setModal({ open: false, form: {} });
                        await load();
                      } catch (error) {
                        setCsvUploadMsg(error?.response?.data?.error || 'Failed to add student');
                      }
                    }}
                    className="space-y-4"
                  >
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Add Single Student</h2>
                    <input name="name" required placeholder="Name" className="w-full border rounded px-3 py-2" value={modal.form.name || ''} onChange={e => setModal(m => ({ ...m, form: { ...m.form, name: e.target.value } }))} />
                    <input name="email" required placeholder="Email" className="w-full border rounded px-3 py-2" value={modal.form.email || ''} onChange={e => setModal(m => ({ ...m, form: { ...m.form, email: e.target.value } }))} />
                    <input name="password" required placeholder="Password" type="password" className="w-full border rounded px-3 py-2" value={modal.form.password || ''} onChange={e => setModal(m => ({ ...m, form: { ...m.form, password: e.target.value } }))} />
                    <input name="studentId" required placeholder="Student ID" className="w-full border rounded px-3 py-2" value={modal.form.studentId || ''} onChange={e => setModal(m => ({ ...m, form: { ...m.form, studentId: e.target.value } }))} />
                    <button type="submit" className="w-full bg-blue-600 text-white rounded px-4 py-2 font-medium hover:bg-blue-700 transition">Add</button>
                  </form>
                </Modal>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Teacher Portal • {new Date().getFullYear()} • <span className="ml-2 text-gray-400">Streamline your academic scheduling</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}