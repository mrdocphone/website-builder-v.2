import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface SignupProps {
  onSignupSuccess: (data: { type: 'user', username: string }) => void;
}

const Signup: React.FC<SignupProps> = ({ onSignupSuccess }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, username, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Automatically log the user in upon successful signup
            onSignupSuccess({ type: 'user', username: data.username });
        } else {
            setError(data.message || 'Failed to create account.');
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
          <h1 className="text-3xl font-bold text-slate-800">Create an Account</h1>
          <p className="mt-2 text-slate-600">Start building your website today!</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="text-sm font-medium text-slate-700 block mb-2">Full Name</label>
            <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="John Doe"/>
          </div>
          <div>
            <label htmlFor="username" className="text-sm font-medium text-slate-700 block mb-2">Username</label>
            <input id="username" type="text" autoComplete="username" required value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="john-doe"/>
              <p className="text-xs text-slate-500 mt-1">Lowercase letters, numbers, and dashes only.</p>
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-700 block mb-2">Password</label>
            <input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="••••••••"/>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          
          <div>
            <button type="submit" disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed">
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Log in
            </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;