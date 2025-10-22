import React, { useState, useEffect } from 'react';
import { WarningIcon } from './icons';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSetupMissing, setIsSetupMissing] = useState(false);

  useEffect(() => {
    // Check with the server if custom credentials are set
    const checkConfig = async () => {
        try {
            const res = await fetch('/api/config');
            if (res.ok) {
                const data = await res.json();
                setIsSetupMissing(!data.isConfigured);
            } else {
                // If the check fails, assume setup is missing to be safe
                setIsSetupMissing(true);
            }
        } catch (e) {
            console.error("Could not check server configuration", e);
            setIsSetupMissing(true);
        }
    };
    checkConfig();
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            onLoginSuccess();
        } else {
            setError(data.message || 'Invalid username or password.');
        }
    } catch (err) {
        setError('Could not connect to the server. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 font-sans p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">Gen-Z Builder Login</h1>
          <p className="mt-2 text-slate-600">Access the Gen-Z Builder</p>
        </div>
        
        {isSetupMissing && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <WarningIcon className="h-5 w-5 text-amber-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">Action Required: Secure Your Admin Login</h3>
                        <div className="mt-2 text-sm text-amber-700">
                             <p className="mb-2">Your site is using insecure default credentials. For security, set your own credentials in your hosting provider (e.g., Vercel).</p>
                             <p className="font-semibold text-amber-900">Note: This is for simple access control, not high security.</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>In your project's <strong>Settings &gt; Environment Variables</strong>:</li>
                                <li>Add <code className="bg-amber-100 text-amber-900 px-1 rounded-sm text-xs">ADMIN_USERNAME</code> with your username.</li>
                                <li>Add <code className="bg-amber-100 text-amber-900 px-1 rounded-sm text-xs">ADMIN_PASSWORD</code> with your password.</li>
                                <li>You must <strong>Redeploy</strong> your project for the new variables to apply.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="text-sm font-medium text-slate-700 block mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={isSetupMissing ? "Default: admin" : "Username"}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700 block mb-2"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={isSetupMissing ? "Default: password" : "Password"}
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;