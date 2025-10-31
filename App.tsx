



// FIX: Corrected the invalid import syntax. `aistudio` was a typo and `useState` should be destructured.
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, Outlet } from 'react-router-dom';
import PublishedWebsite from './components/PublishedWebsite';
import Login from './components/Login';
import AdminDashboardLayout, { DashboardWelcome } from './components/AdminDashboard';
import UserManagementDashboard from './components/UserManagementDashboard';
import Signup from './components/Signup';
import type { Session } from './types';
import Editor from './components/Editor';
import { LogoutIcon, PencilIcon, LinkIcon } from './components/icons';

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
    const navigate = useNavigate();
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 font-sans p-4">
        <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-lg shadow-xl text-center">
            <h1 className="text-3xl font-bold text-slate-800">Welcome, {session.username}</h1>
            <p className="mt-2 text-slate-600">
              Manage your website from the editor or view your published site.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => navigate('/editor')}
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PencilIcon className="w-5 h-5 mr-3" />
                Go to Editor
              </button>
              <a
                href={`/${session.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex items-center justify-center px-6 py-3 text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                  <LinkIcon className="w-5 h-5 mr-3" />
                  View Published Site
              </a>
            </div>
            <div className="mt-8">
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
    // FIX: Corrected the call to `useState`. The `aistudio` prefix was a typo.
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
    
    // Renders child routes if the user is authenticated, otherwise redirects to login.
    const UserRouteProtection: React.FC = () => {
      if (!session.isAuthenticated || session.type !== 'user') {
        return <Navigate to="/login" replace />;
      }
      return <Outlet />;
    };

    // This component acts as a "gatekeeper" for the admin section.
    // It renders the admin dashboard layout (which includes an <Outlet/>) only for authenticated admins.
    // Otherwise, it redirects to the admin login page.
    const AdminRouteProtector: React.FC = () => {
        if (session.isAuthenticated && session.type === 'admin') {
            return <AdminDashboardLayout onLogout={handleLogout} />;
        }
        // Redirect to a dedicated admin login route.
        return <Navigate to="/admin/login" replace />;
    };

    return (
        <Routes>
            {/* --- Application Routes --- */}
            {/* Placed first to ensure they are matched before the dynamic content routes. */}
            
            {/* Root Redirect */}
            <Route path="/" element={<Navigate to={session.isAuthenticated ? (session.type === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />} />

            {/* Public Routes */}
            <Route path="/login" element={!session.isAuthenticated ? <Login type="user" onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/dashboard" replace />} />
            <Route path="/signup" element={!session.isAuthenticated ? <Signup onSignupSuccess={handleSignupSuccess} /> : <Navigate to="/dashboard" replace />} />
            
            {/* Admin Login Route */}
            <Route 
                path="/admin/login" 
                element={
                    (session.isAuthenticated && session.type === 'admin') 
                    ? <Navigate to="/admin" replace /> 
                    : <Login type="admin" onLoginSuccess={handleLoginSuccess} />
                } 
            />

            {/* Protected Admin Routes */}
            <Route element={<AdminRouteProtector />}>
                <Route path="/admin" element={<DashboardWelcome />} />
                <Route path="/admin/users" element={<UserManagementDashboard />} />
            </Route>

            {/* User Protected Routes */}
            <Route element={<UserRouteProtection />}>
                <Route path="/dashboard" element={<UserDashboard onLogout={handleLogout} session={session} />} />
                <Route path="/editor" element={<Editor session={session} />} />
            </Route>
            
            {/* --- Published Site Routes (Catch-all) --- */}
            {/* These routes are last to act as a fallback for any path that isn't a defined application route. */}
            <Route path="/:username/:slug?" element={<PublishedWebsite />} />
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