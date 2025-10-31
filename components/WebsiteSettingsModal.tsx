import React, { useState } from 'react';
import type { WebsiteData, Session } from '../types';
import { XIcon, GlobeIcon, UsersIcon, DatabaseIcon, TagIcon } from './icons';

interface WebsiteSettingsModalProps {
    website: WebsiteData;
    onClose: () => void;
    onSave: (updatedData: WebsiteData) => void;
    session: Session;
}

const WebsiteSettingsModal: React.FC<WebsiteSettingsModalProps> = ({ website, onClose, onSave, session }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [name, setName] = useState(website.name);
    const [tags, setTags] = useState(website.tags?.join(', ') || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        setIsLoading(true);
        setError('');
        try {
            const updates = {
                name,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            };

            const res = await fetch('/api/websites', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    websiteId: website.id,
                    username: session.username,
                    updates,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to save settings.");
            }

            const updatedData = await res.json();
            onSave(updatedData);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: TagIcon },
        { id: 'domain', label: 'Domain', icon: GlobeIcon },
        { id: 'collaborators', label: 'Collaborators', icon: UsersIcon },
        { id: 'backups', label: 'Backups', icon: DatabaseIcon },
    ];

    return (
        <div className="settings-modal-overlay fixed inset-0 flex items-center justify-center p-4">
            <div className="settings-modal w-full max-w-4xl h-[80vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
                <header className="settings-modal-header p-4 flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Website Settings</h2>
                        <p className="text-sm text-gray-500">{website.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">
                        <XIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="flex flex-grow overflow-hidden">
                    <aside className="w-56 p-4 border-r dark:border-slate-700 flex-shrink-0">
                        <nav className="space-y-1">
                            {tabs.map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${activeTab === tab.id ? 'active' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                    <tab.icon className="w-5 h-5" /> {tab.label}
                                </button>
                            ))}
                        </nav>
                    </aside>
                    <main className="flex-grow p-6 overflow-y-auto">
                        {activeTab === 'general' && (
                            <div className="space-y-6 max-w-lg">
                                <div>
                                    <label htmlFor="siteName" className="text-sm font-medium block mb-1">Website Name</label>
                                    <input id="siteName" type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded-md bg-transparent dark:border-slate-600" />
                                </div>
                                <div>
                                    <label htmlFor="siteTags" className="text-sm font-medium block mb-1">Tags</label>
                                    <input id="siteTags" type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full p-2 border rounded-md bg-transparent dark:border-slate-600" />
                                    <p className="text-xs text-gray-500 mt-1">Separate tags with a comma.</p>
                                </div>
                            </div>
                        )}
                         {activeTab !== 'general' && (
                             <div className="text-center text-gray-500 p-10">
                                This feature is coming soon!
                             </div>
                         )}
                    </main>
                </div>
                <footer className="settings-modal-footer p-4 flex justify-end items-center gap-3 flex-shrink-0">
                    {error && <p className="text-sm text-red-500 mr-auto">{error}</p>}
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600">Cancel</button>
                    <button onClick={handleSave} disabled={isLoading} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default WebsiteSettingsModal;
