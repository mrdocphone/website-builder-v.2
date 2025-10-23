import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from './icons';

interface User {
  name: string;
  username: string;
}

const UserManagementDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/users');
                if (!response.ok) {
                    throw new Error('Failed to fetch user data.');
                }
                const data = await response.json();
                setUsers(data);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'An unknown error occurred.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return (
        <div className="p-6 md:p-10">
            <Link to="/admin" className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 mb-6">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Admin Dashboard
            </Link>

            <h2 className="text-3xl font-bold text-slate-800 mb-6">User Management</h2>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {isLoading ? (
                    <div className="p-10 text-center text-slate-600">Loading users...</div>
                ) : error ? (
                    <div className="p-10 text-center text-red-600">{error}</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Name</th>
                                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Username</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map(user => (
                                    <tr key={user.username} className="border-b border-slate-200 last:border-b-0">
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-800">{user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono">{user.username}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="text-center px-6 py-10 text-slate-500">No users have signed up yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default UserManagementDashboard;