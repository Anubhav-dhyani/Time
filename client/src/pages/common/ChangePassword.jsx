import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/AuthContext.jsx';

export default function ChangePassword() {
  const { api, user, setUser } = useAuth();
  const nav = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (newPassword !== confirm) return setError('Passwords do not match');
    try {
  await api.post('/auth/change-password', { oldPassword: currentPassword, newPassword });
      setUser({ ...user, mustChangePassword: false });
      setOk(true);
      setTimeout(() => nav(`/${user.role}`), 800);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={onSubmit} className="bg-white p-8 rounded shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-center">Change Password</h1>
        {user?.mustChangePassword && <p className="text-sm text-gray-600 text-center">Please set a new password to continue.</p>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {ok && <div className="text-green-600 text-sm">Password updated</div>}
        <div>
          <label className="block text-sm">Current password</label>
          <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">New password</label>
          <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Confirm new password</label>
          <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
        </div>
        <button className="w-full bg-gray-900 text-white rounded py-2">Update password</button>
      </form>
    </div>
  );
}
