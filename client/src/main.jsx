import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import TeacherDashboard from './pages/teacher/TeacherDashboard.jsx';
import TeacherSetup from './pages/teacher/TeacherSetup.jsx';
import TeacherEdit from './pages/teacher/TeacherEdit.jsx';
import StudentDashboard from './pages/student/StudentDashboard.jsx';
import { AuthProvider, useAuth } from './state/AuthContext.jsx';

function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<Protected role="admin"><AdminDashboard /></Protected>} />
  <Route path="/teacher" element={<Protected role="teacher"><TeacherDashboard /></Protected>} />
  <Route path="/teacher/setup" element={<Protected role="teacher"><TeacherSetup /></Protected>} />
  <Route path="/teacher/edit" element={<Protected role="teacher"><TeacherEdit /></Protected>} />
        <Route path="/student" element={<Protected role="student"><StudentDashboard /></Protected>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
