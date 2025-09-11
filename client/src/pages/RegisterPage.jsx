import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';

export default function RegisterPage() {
  const { api, login } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', { name, email, password });
      // auto login
      const user = await login(email, password);
      nav(`/${user.role}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={onSubmit} className="bg-white p-8 rounded shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-center">Student Sign up</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div>
          <label className="block text-sm">Name</label>
          <input className="mt-1 w-full border rounded px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input className="mt-1 w-full border rounded px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        <button className="w-full bg-gray-900 text-white rounded py-2">Create account</button>
        <button type="button" onClick={()=>nav('/login')} className="w-full text-sm underline">Back to login</button>
      </form>
    </div>
  );
}
