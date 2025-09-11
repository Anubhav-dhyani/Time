import React from 'react';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../images/gehu.webp';
import logoImage from '../images/GEHU-logo.webp';

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Overlay to improve text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      
      

      {/* University Name */}
      <div className="relative z-10 mb-8 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide drop-shadow-md">
          Graphic Era Hill University
        </h2>
        <p className="text-white text-opacity-90 text-sm md:text-base mt-1 drop-shadow-md">
          Dehradun, Uttarakhand
        </p>
      </div>

      {/* Glassmorphism Login Card */}
      <div className="relative z-10 bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-xs md:max-w-sm flex flex-col justify-center text-center transform transition-all duration-300 hover:bg-opacity-15 hover:backdrop-blur-xl">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-2 drop-shadow-md">
          Welcome to Portal
        </h1>
        <p className="text-white text-opacity-80 mb-6 text-sm md:text-base drop-shadow-md">
          Select your login type to continue
        </p>
        
        <div className="space-y-4">
          <button
            className="w-full bg-white bg-opacity-90 text-gray-800 py-3 rounded-xl text-base md:text-lg font-semibold hover:bg-opacity-100 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
            onClick={() => navigate('/login/admin')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Admin Login
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          
          <button
            className="w-full bg-white bg-opacity-90 text-gray-800 py-3 rounded-xl text-base md:text-lg font-semibold hover:bg-opacity-100 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
            onClick={() => navigate('/login/teacher')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Teacher Login
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          
          <button
            className="w-full bg-white bg-opacity-90 text-gray-800 py-3 rounded-xl text-base md:text-lg font-semibold hover:bg-opacity-100 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group"
            onClick={() => navigate('/login/student')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            Student Login
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Footer text */}
      <div className="relative z-10 mt-8 text-center">
        <p className="text-white text-opacity-80 text-xs md:text-sm drop-shadow-md">
          © {new Date().getFullYear()} Graphic Era Hill University. All rights reserved.
        </p>
      </div>
    </div>
  );
}