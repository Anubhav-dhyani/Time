import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

export default function TeacherHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const isDashboard = location.pathname === '/teacher';
  const isSetup = location.pathname === '/teacher/setup';
  const isEdit = location.pathname === '/teacher/edit';

  return (
    <header className="sticky top-0 z-30 bg-white shadow-lg border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Teacher Portal</h1>
            <p className="text-gray-600 mt-1">Welcome, {user?.name || 'Teacher'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {(isSetup || isEdit) ? (
            <button
              onClick={() => nav('/teacher')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl transition-colors duration-300 flex items-center shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          ) : (
            <button
              onClick={() => nav('/teacher/setup')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-colors duration-300 flex items-center shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Setup Timetable
            </button>
          )}
          <button
            onClick={logout}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl transition-colors duration-300 flex items-center shadow-md"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
