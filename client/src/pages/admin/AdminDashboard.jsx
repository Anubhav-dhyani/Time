import React, { useEffect, useState } from 'react';
import { useAuth } from '../../state/AuthContext.jsx';

export default function AdminDashboard() {
  const { api, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [result, setResult] = useState(null);

  const refresh = async () => {
    const { data } = await api.get('/admin/users');
    setUsers(data.users);
  };
  useEffect(() => { refresh(); }, []);

  const upload = async (path) => {
    const file = document.getElementById(path).files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post(`/admin/upload/${path}`, form);
    setResult(data);
    await refresh();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <button onClick={logout} className="text-sm underline">Logout</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-medium mb-2">Upload Teachers CSV/XLSX</h2>
          <input id="teachers" type="file" className="block mb-2" />
          <button className="bg-gray-900 text-white px-3 py-1 rounded" onClick={() => upload('teachers')}>Upload</button>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="font-medium mb-2">Upload Students CSV/XLSX</h2>
          <input id="students" type="file" className="block mb-2" />
          <button className="bg-gray-900 text-white px-3 py-1 rounded" onClick={() => upload('students')}>Upload</button>
        </div>
      </div>

      {result && (
        <div className="bg-white p-4 rounded shadow">
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-medium mb-2">All Users</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">TeacherId</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} className="border-t">
                  <td className="p-2">{u.name}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role}</td>
                  <td className="p-2">{u.teacherId || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
