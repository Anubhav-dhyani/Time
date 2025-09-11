import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Choose your portal</h1>
        <div className="space-y-2">
          <button className="w-full bg-gray-900 text-white rounded py-2" onClick={()=>nav('/login/admin')}>Admin login</button>
          <button className="w-full bg-gray-900 text-white rounded py-2" onClick={()=>nav('/login/teacher')}>Teacher login</button>
          <button className="w-full bg-gray-900 text-white rounded py-2" onClick={()=>nav('/login/student')}>Student login</button>
        </div>
        <button type="button" onClick={()=>nav('/register')} className="w-full text-sm underline">Student sign up</button>
      </div>
    </div>
  );
}
