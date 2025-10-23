import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, Outlet } from 'react-router-dom';
import Editor from './components/Editor';
import PublishedWebsite from './components/PublishedWebsite';
import Login from './components/Login';
import AdminDashboardLayout, { DashboardWelcome } from './components/AdminDashboard';
import UserManagementDashboard from './components/UserManagementDashboard';
import Signup from './components/Signup';
import type { WebsiteData } from './types';

export interface Session {
    isAuthenticated: boolean;
    type: 'admin' | 'user' | null;
    username: string | null;
}

const getInitialSession = (): Session => {
    // Check for persistent "Remember Me" login first
    const storedSession = localStorage.getItem('session');
    if (storedSession) {
        try {
            const parsed = JSON.parse(storedSession);
            if (parsed.isAuthenticated) return parsed;
        } catch (e) { /* ignore parsing error */ }
    }
    // Fallback to session-only login
    const sessionOnly = sessionStorage.getItem('session');
    if (sessionOnly) {
        try {
            const parsed = JSON.parse(sessionOnly);
            if (parsed.isAuthenticated) return parsed;
        } catch (e) { /* ignore parsing error */ }
    }
    // Default unauthenticated session
    return { isAuthenticated: false, type: null, username: null };
};


const AppContent: React.FC = () => {
    const navigate = useNavigate();
    
    const [session, setSession] = useState<Session>(getInitialSession());
    const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Effect to load data from the server
    useEffect(() => {
      if (!session.isAuthenticated || !session.username) {
          setIsLoading(false);
          return;
      }

      const loadData = async () => {
          setIsLoading(true);
          setError(null);
          try {
              const response = await fetch(`/api/editor-data?username=${session.username}`);
              if (!response.ok) throw new Error('Failed to load editor data.');
              const data = await response.json();
              setWebsiteData(data);
          } catch (e) {
              setError(e instanceof Error ? e.message : 'An unknown error occurred.');
          } finally {
              setIsLoading(false);
          }
      };
      loadData();
    }, [session]);

    // Debounced effect to save data to the server
    useEffect(() => {
        if (!websiteData || isLoading || !session.isAuthenticated || !session.username) return;

        const handler = setTimeout(async () => {
            try {
                await fetch('/api/editor-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ websiteData, username: session.username })
                });
            } catch (e) {
                console.error("Failed to save website data to server", e);
            }
        }, 1000);

        return () => clearTimeout(handler);
    }, [websiteData, isLoading, session]);

    const handleLoginSuccess = (data: { type: 'admin' | 'user'; username: string }, remember: boolean) => {
        const newSession: Session = { isAuthenticated: true, ...data };
        if (remember) {
            localStorage.setItem('session', JSON.stringify(newSession));
        } else {
            sessionStorage.setItem('session', JSON.stringify(newSession));
        }
        setSession(newSession);
        navigate(data.type === 'admin' ? '/admin' : '/editor');
    };
    
    const handleSignupSuccess = (data: { type: 'user'; username: string }) => {
        // Log in without "remember me" by default after signup
        const newSession: Session = { isAuthenticated: true, ...data };
        sessionStorage.setItem('session', JSON.stringify(newSession));
        setSession(newSession);
        navigate('/editor');
    }

    const handleLogout = () => {
        sessionStorage.removeItem('session');
        localStorage.removeItem('session');
        const unauthenticatedSession = { isAuthenticated: false, type: null, username: null };
        setSession(unauthenticatedSession);
        setWebsiteData(null);
        navigate('/login');
    };
    
    if (isLoading && session.isAuthenticated) {
        return <div className="flex items-center justify-center h-screen"><div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
    }
    if (error) {
        return <div className="p-4 text-center text-red-600"><h1>Error</h1><p>{error}</p></div>;
    }
    
    const AdminRouteProtection = () => {
      if (!session.isAuthenticated || session.type !== 'admin') {
        return <Navigate to="/admin" replace />;
      }
      return <Outlet />;
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
            <Route path="/login" element={!session.isAuthenticated ? <Login type="user" onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/editor" replace />} />
            <Route path="/signup" element={!session.isAuthenticated ? <Signup onSignupSuccess={handleSignupSuccess} /> : <Navigate to="/editor" replace />} />
            
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

            {/* --- User/Admin Protected Editor Route --- */}
            <Route element={<UserRouteProtection />}>
                <Route path="/editor" element={websiteData ? <Editor websiteData={websiteData} setWebsiteData={setWebsiteData} onLogout={handleLogout} session={session} /> : null} />
            </Route>
            
            {/* --- Root Redirect --- */}
            <Route path="/" element={<Navigate to={session.isAuthenticated ? (session.type === 'admin' ? '/admin' : '/editor') : '/login'} replace />} />
            
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