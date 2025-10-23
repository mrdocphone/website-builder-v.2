import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoutIcon, PencilIcon } from './icons';

interface AdminDashboardProps {
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen font-sans bg-slate-100">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-slate-800">Gen-Z Builder</h1>
            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <LogoutIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg p-8 space-y-8 bg-white rounded-lg shadow-xl text-center">
            <h2 className="text-3xl font-bold text-slate-800">Admin Dashboard</h2>
            <p className="text-slate-600">Welcome, Admin. Manage your website from here.</p>
            <button
                onClick={() => navigate('/editor')}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white text-lg font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
                <PencilIcon className="w-5 h-5 mr-3" />
                Go to Website Editor
            </button>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
