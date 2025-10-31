
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session, WebsiteData, Page } from '../types';
import { LogoutIcon, PencilIcon, LinkIcon, PlusIcon, TrashIcon } from './icons';

const WebsiteDashboard: React.FC<{ onLogout: () => void, session: Session }> = ({ onLogout, session }) => {
    const navigate = useNavigate();
    const [websites, setWebsites] = useState<WebsiteData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWebsites = useCallback(async () => {
        if (!session.username) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/websites?username=${session.username}`);
            if (res.ok) {
                const data = await res.json();
                setWebsites(data);
            } else {
                throw new Error("Failed to load your websites.");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [session.username]);

    useEffect(() => {
        fetchWebsites();
    }, [fetchWebsites]);

    const handleCreateNew = async () => {
        const name = prompt("Enter a name for your new website:", "My New Site");
        if (name && session.username) {
            try {
                const res = await fetch('/api/websites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, username: session.username })
                });
                const newWebsite = await res.json();
                if (res.ok) {
                    navigate(`/editor/${newWebsite.id}`);
                } else {
                    alert(newWebsite.message || "Could not create website.");
                }
            } catch (e) {
                alert("An error occurred while creating the website.");
            }
        }
    };
    
    const handleDelete = async (website: WebsiteData) => {
        if (window.confirm(`Are you sure you want to delete "${website.name}"? This cannot be undone.`)) {
            try {
                 const res = await fetch('/api/websites', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ websiteId: website.id, username: session.username })
                });
                if (res.ok) {
                    setWebsites(sites => sites.filter(s => s.id !== website.id));
                } else {
                    const err = await res.json();
                    alert(err.message || "Failed to delete website.");
                }
            } catch (e) {
                alert("An error occurred while deleting the website.");
            }
        }
    }
    
    const getHomepageSlug = (site: WebsiteData): string => {
        const homepage = site.pages.find(p => p.isHomepage);
        return homepage ? homepage.slug : (site.pages[0]?.slug || '');
    }

    return (
      <div className="min-h-screen bg-slate-100 font-sans">
        <header className="bg-white shadow-sm">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                 <h1 className="text-2xl font-bold text-slate-800">My Websites</h1>
                 <button
                    onClick={onLogout}
                    className="flex items-center px-4 py-2 text-sm font-medium rounded-md text-slate-600 bg-slate-100 hover:bg-slate-200"
                  >
                    <LogoutIcon className="w-5 h-5 mr-2" />
                    Logout
                  </button>
            </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
             <div className="flex justify-between items-center mb-6">
                <p className="text-slate-600">Manage your websites or create a new one.</p>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create New Website
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md">
                {isLoading ? (
                    <div className="dashboard-center-state">
                        <div className="dashboard-spinner"></div>
                        <p className="mt-3 text-slate-600">Loading your websites...</p>
                    </div>
                ) : error ? (
                    <div className="p-10 text-center text-red-600">{error}</div>
                ) : websites.length > 0 ? (
                    <ul className="divide-y divide-slate-200">
                        {websites.map(site => (
                            <li key={site.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                <div className="mb-4 sm:mb-0">
                                    <h2 className="text-lg font-semibold text-slate-800">{site.name}</h2>
                                    <a 
                                        href={`/${session.username}/${getHomepageSlug(site)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-indigo-600 hover:underline flex items-center mt-1"
                                    >
                                        Live Site
                                        <LinkIcon className="w-4 h-4 ml-1.5" />
                                    </a>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                     <button
                                        onClick={() => handleDelete(site)}
                                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                                        title="Delete Website"
                                     >
                                        <TrashIcon className="w-5 h-5"/>
                                     </button>
                                     <button
                                        onClick={() => navigate(`/editor/${site.id}`)}
                                        className="flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        <PencilIcon className="w-4 h-4 mr-2" />
                                        Edit
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="dashboard-center-state">
                        <h3 className="text-xl font-semibold text-slate-700">No websites yet!</h3>
                        <p className="mt-2 max-w-md text-slate-500">
                           Ready to build something amazing? Click the button below to start your first website.
                        </p>
                        <button
                           onClick={handleCreateNew}
                           className="mt-6 flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                           <PlusIcon className="w-5 h-5 mr-2" />
                           Create Your First Website
                        </button>
                    </div>
                )}
            </div>
        </main>
      </div>
    );
};

export default WebsiteDashboard;
