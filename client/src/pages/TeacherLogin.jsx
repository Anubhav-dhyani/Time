import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import backgroundImage from '../images/gehu.webp';
import logoImage from '../images/GEHU-logo.webp';

export default function TeacherLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const user = await login(identifier, password, 'teacher');
      if (user.role !== 'teacher') throw new Error('Wrong portal');
      navigate('/teacher');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Overlay to improve text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      
      

      {/* University Name */}
      <div className="relative z-10 mb-6 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide drop-shadow-md">
          Graphic Era Hill University
        </h2>
        <p className="text-white text-opacity-90 text-sm md:text-base mt-1 drop-shadow-md">
          Teacher Portal
        </p>
      </div>

      {/* Glassmorphism Login Card */}
      <div className="relative z-10 bg-white bg-opacity-10 backdrop-blur-lg border border-white border-opacity-20 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-xs md:max-w-sm">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight drop-shadow-md">
            Teacher Login
          </h1>
          <button 
            onClick={() => navigate('/')}
            className="text-white text-opacity-80 hover:text-opacity-100 transition-colors duration-200"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500 bg-opacity-20 border border-red-400 border-opacity-50 text-red-200 px-4 py-3 rounded-lg flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Email/Teacher ID Field */}
          <div className="relative">
            <label htmlFor="identifier" className="block text-sm font-medium text-white mb-1 drop-shadow-md">
              Email or Teacher ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mt-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white text-opacity-70" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="mt-1 w-full pl-10 pr-4 py-3 text-white border border-white border-opacity-30 rounded-lg bg-white bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-white placeholder-opacity-60"
                placeholder="Enter email or teacher ID"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-white mb-1 drop-shadow-md">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none mt-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white text-opacity-70" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full pl-10 pr-12 py-3 text-white border border-white border-opacity-30 rounded-lg bg-white bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent placeholder-white placeholder-opacity-60"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center mt-5"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white text-opacity-70" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white text-opacity-70" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white bg-opacity-90 text-gray-800 py-3 rounded-xl text-lg font-semibold hover:bg-opacity-100 hover:shadow-lg transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Help Text */}
        <p className="mt-6 text-center text-white text-opacity-80 text-sm">
          Use your email or teacher ID and password to login
        </p>
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