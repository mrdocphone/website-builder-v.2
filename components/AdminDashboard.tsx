
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LogoutIcon, UsersIcon, HomeIcon } from './icons';


interface AdminDashboardLayoutProps {
  onLogout: () => void;
}

const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({ onLogout }) => {
  
  const navItems = [
    { to: '/admin', text: 'Dashboard', icon: HomeIcon },
    { to: '/admin/users', text: 'User Management', icon: UsersIcon },
  ];

  return (
    <div className="flex h-screen font-sans bg-slate-100">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <h1 className="text-2xl font-bold text-slate-800">Gen-Z Builder</h1>
        </div>
        <div className="flex-1 py-4">
            {navItems.map(item => (
                <NavLink 
                    key={item.to} 
                    to={item.to}
                    end={item.to === '/admin'} // Match exact for dashboard
                    className={({ isActive }) => `flex items-center px-4 py-2.5 mx-2 my-1 text-sm font-medium rounded-md transition-colors ${
                        isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.text}
                </NavLink>
            ))}
        </div>
        <div className="p-4 border-t border-slate-200">
            <button
              onClick={onLogout}
              className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-md text-slate-600 hover:bg-slate-100"
            >
              <LogoutIcon className="w-5 h-5 mr-3" />
              Logout
            </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

// Welcome component for the dashboard root
export const DashboardWelcome: React.FC = () => (
    <div className="p-6 md:p-10">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Admin Dashboard</h2>
        <p className="text-slate-600">Welcome, Admin. Use the sidebar to navigate and manage your application.</p>
    </div>
);

export default AdminDashboardLayout;