

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, Outlet } from 'react-router-dom';
import PublishedWebsite from './components/PublishedWebsite';
import Login from './components/Login';
import AdminDashboardLayout, { DashboardWelcome } from './components/AdminDashboard';
import UserManagementDashboard from './components/UserManagementDashboard';
import Signup from './components/Signup';
import type { Session } from './types';
import { LogoutIcon } from './components/icons';

const getInitialSession = (): Session => {
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
        try {
            const parsed = JSON.parse(storedSession);
            if (parsed.isAuthenticated) return parsed;
        } catch (e) { /* ignore parsing error */ }
    }
    const sessionOnly = sessionStorage.getItem('session');
    if (sessionOnly) {
        try {
            const parsed = JSON.parse(sessionOnly);
            if (parsed.isAuthenticated) return parsed;
        } catch (e) { /* ignore parsing error */ }
    }
    return { isAuthenticated: false, type: null, username: null };
};

const UserDashboard: React.FC<{ onLogout: () => void, session: Session }> = ({ onLogout, session }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 font-sans p-4">
      <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-xl text-center">
          <h1 className="text-3xl font-bold text-slate-800">Welcome, {session.username}</h1>
          <p className="mt-2 text-slate-600">
            You can view your published site using its direct URL. The editor is currently disabled.
          </p>
          <div className="mt-6">
            <button
              onClick={onLogout}
              className="w-full max-w-xs mx-auto flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md text-slate-600 bg-slate-100 hover:bg-slate-200"
            >
              <LogoutIcon className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState<Session>(getInitialSession());

    const handleLoginSuccess = (data: { type: 'admin' | 'user'; username: string }, remember: boolean) => {
        const newSession: Session = { isAuthenticated: true, ...data };
        if (remember) {
            localStorage.setItem('session', JSON.stringify(newSession));
        } else {
            sessionStorage.setItem('session', JSON.stringify(newSession));
        }
        setSession(newSession);
        navigate(data.type === 'admin' ? '/admin' : '/dashboard');
    };
    
    const handleSignupSuccess = (data: { type: 'user'; username: string }) => {
        const newSession: Session = { isAuthenticated: true, ...data };
        sessionStorage.setItem('session', JSON.stringify(newSession));
        setSession(newSession);
        navigate('/dashboard');
    }

    const handleLogout = () => {
        sessionStorage.removeItem('session');
        localStorage.removeItem('session');
        const unauthenticatedSession = { isAuthenticated: false, type: null, username: null };
        setSession(unauthenticatedSession);
        navigate('/login');
    };
    
    const UserRouteProtection = () => {
      if (!session.isAuthenticated) {
        return <Navigate to="/login" replace />;
      }
      return <Outlet />;
    };

    return (
        <Routes>
            {/* --- Public Routes --- */}
            <Route path="/login" element={!session.isAuthenticated ? <Login type="user" onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/signup" element={!session.isAuthenticated ? <Signup onSignupSuccess={handleSignupSuccess} /> : <Navigate to="/dashboard" replace />} />
            
            {/* --- Admin Login/Dashboard Routes --- */}
            <Route 
                path="/admin/*" 
                element={
                    session.isAuthenticated && session.type === 'admin' ? (
                        <AdminDashboardLayout onLogout={handleLogout}>
                            <Routes>
                                <Route index element={<DashboardWelcome />} />
                                <Route path="users" element={<UserManagementDashboard />} />
                            </Routes>
                        </AdminDashboardLayout>
                    ) : (
                        <Login type="admin" onLoginSuccess={handleLoginSuccess} />
                    )
                }
            />

            {/* --- User Protected Route --- */}
            <Route element={<UserRouteProtection />}>
                <Route path="/dashboard" element={<UserDashboard onLogout={handleLogout} session={session} />} />
            </Route>
            
            {/* --- Root Redirect --- */}
            <Route path="/" element={<Navigate to={session.isAuthenticated ? (session.type === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />} />
            
            {/* --- Published Site Routes (Catch-all) --- */}
            <Route path="/:username/:slug" element={<PublishedWebsite />} />
            <Route path="/:username" element={<PublishedWebsite />} />
        </Routes>
    );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;