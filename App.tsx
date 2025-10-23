import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Editor from './components/Editor';
import PublishedWebsite from './components/PublishedWebsite';
import Login from './components/Login';
import type { WebsiteData, Section } from './types';
import { v4 as uuidv4 } from 'uuid';

const AppContent: React.FC = () => {
    const navigate = useNavigate();
    
    // Check if we're in a development/preview environment like AI Studio
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.endsWith('.aistudio.dev');

    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        // Bypass authentication for local development/preview in AI Studio
        if (isDevelopment) {
            return true;
        }
        // Check for persistent "Remember Me" login first
        if (localStorage.getItem('isAuthenticated') === 'true') {
            return true;
        }
        // Fallback to session-only login
        return sessionStorage.getItem('isAuthenticated') === 'true';
    });

    const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Effect to load data from the server
    useEffect(() => {
      // Only fetch data if authenticated.
      if (!isAuthenticated) {
          setIsLoading(false);
          return;
      }

      const loadData = async () => {
          setIsLoading(true);
          setError(null);
          try {
              const response = await fetch('/api/editor-data');
              if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(errorData.message || 'Failed to load editor data.');
              }
              const data = await response.json();
              setWebsiteData(data);
          } catch (e) {
              setError(e instanceof Error ? e.message : 'An unknown error occurred while loading data.');
          } finally {
              setIsLoading(false);
          }
      };

      loadData();
    }, [isAuthenticated]);


    // Debounced effect to save data to the server
    useEffect(() => {
        // Don't save if data is null, or we are in the initial loading state.
        if (!websiteData || isLoading) {
            return;
        }

        const handler = setTimeout(async () => {
        try {
            await fetch('/api/editor-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(websiteData)
            });
            // Optionally, add a "Saved" indicator here in the UI
        } catch (e) {
            console.error("Failed to save website data to server", e);
            // Optionally, add a "Save failed" indicator
        }
        }, 1000); // Debounce saves by 1 second

        return () => clearTimeout(handler);
    }, [websiteData, isLoading]);

    const handleLoginSuccess = (remember: boolean) => {
        if (remember) {
            localStorage.setItem('isAuthenticated', 'true');
        } else {
            sessionStorage.setItem('isAuthenticated', 'true');
        }
        setIsAuthenticated(true);
        navigate('/editor');
    };

    const handleLogout = () => {
        sessionStorage.removeItem('isAuthenticated');
        localStorage.removeItem('isAuthenticated'); // Clear persistent login as well
        setIsAuthenticated(false);
        setWebsiteData(null); // Clear data on logout
        navigate('/admin');
    };
    
    if (isLoading && isAuthenticated) {
        return (
          <div className="flex items-center justify-center w-screen h-screen bg-slate-100 font-sans">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-700 text-lg">Loading Editor...</p>
            </div>
          </div>
        );
    }
    
    if (error) {
        return (
          <div className="flex items-center justify-center w-screen h-screen bg-slate-100 font-sans p-4">
            <div className="text-center bg-white p-8 rounded-lg shadow-md">
              <h1 className="text-2xl font-bold text-red-600">Loading Error</h1>
              <p className="mt-2 text-slate-700">{error}</p>
            </div>
          </div>
        );
    }

    return (
        <Routes>
            <Route 
                path="/editor" 
                element={
                    isAuthenticated && websiteData ? (
                        <Editor 
                            websiteData={websiteData} 
                            setWebsiteData={setWebsiteData}
                            onLogout={handleLogout}
                        />
                    ) : (
                        <Navigate to="/admin" replace />
                    )
                }
            />
            
            <Route 
                path="/admin" 
                element={
                    isAuthenticated ? (
                        <Navigate to="/editor" replace />
                    ) : (
                        <Login type="admin" onLoginSuccess={handleLoginSuccess} />
                    )
                }
            />

            <Route 
                path="/login"
                element={<Login type="user" />}
            />
            
            <Route 
                path="/" 
                element={
                    isAuthenticated ? (
                        <Navigate to="/editor" replace />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
            
            {/* IMPORTANT: This route must be last to act as a catch-all for slugs */}
            <Route path="/:slug" element={<PublishedWebsite />} />
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