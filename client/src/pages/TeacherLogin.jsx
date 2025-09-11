import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

export default function TeacherLogin() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState(''); // email or teacherId
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const user = await login(identifier, password, 'teacher');
      // backend supports teacherId or email auto-resolution already via identifier
      if (user.role !== 'teacher') throw new Error('Wrong portal');
      nav('/teacher');
    } catch (err) { setError(err.response?.data?.message || 'Login failed'); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={onSubmit} className="bg-white p-8 rounded shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-center">Teacher Sign in</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div>
          <label className="block text-sm">Email or Teacher ID</label>
          <input className="mt-1 w-full border rounded px-3 py-2" value={identifier} onChange={(e)=>setIdentifier(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        <button className="w-full bg-gray-900 text-white rounded py-2">Login</button>
      </form>
    </div>
  );
}
