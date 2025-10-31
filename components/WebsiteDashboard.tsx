import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session, WebsiteData, Page } from '../types';
import WebsiteSettingsModal from './WebsiteSettingsModal';
import { 
    LogoutIcon, PencilIcon, LinkIcon, PlusIcon, TrashIcon, DuplicateIcon, 
    MoreVerticalIcon, GlobeIcon, SettingsIcon, CheckCircleIcon, CloudOffIcon, 
    SearchIcon, GridIcon, ListIcon, SunIcon, MoonIcon, TrendingUpIcon, TagIcon,
    // FIX: Added missing import for `UsersIcon`.
    UsersIcon
} from './icons';

type ViewMode = 'grid' | 'list';
type SortKey = 'lastUpdatedAt' | 'name' | 'createdAt';

const WebsiteDashboard: React.FC<{ onLogout: () => void, session: Session }> = ({ onLogout, session }) => {
    const navigate = useNavigate();
    const [websites, setWebsites] = useState<WebsiteData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // New state for features
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
    const [sortBy, setSortBy] = useState<SortKey>('lastUpdatedAt');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [selectedWebsite, setSelectedWebsite] = useState<WebsiteData | null>(null);
    const [dashboardTheme, setDashboardTheme] = useState<'light' | 'dark'>('light');

    const fetchWebsites = useCallback(async () => {
        if (!session.username) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/websites?username=${session.username}`);
            if (res.ok) {
                const data = await res.json();
                // Add mock data for UI demonstration
                const dataWithMocks = data.map((site: WebsiteData) => ({
                    ...site,
                    analytics: {
                        views: Math.floor(Math.random() * 5000),
                        visitors: Math.floor(Math.random() * 1200),
                    },
                    seoScore: Math.floor(Math.random() * 30) + 70,
                    formSubmissions: Math.floor(Math.random() * 50)
                }));
                setWebsites(dataWithMocks);
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
    
    useEffect(() => {
        document.body.classList.toggle('dark', dashboardTheme === 'dark');
    }, [dashboardTheme]);

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
    
    const handleAction = async (action: 'duplicate' | 'delete' | 'unpublish', website: WebsiteData) => {
        if (action === 'duplicate' && session.username) {
            // ... (duplicate logic)
        } else if (action === 'delete') {
            if (window.confirm(`Are you sure you want to delete "${website.name}"? This cannot be undone.`)) {
                try {
                    const res = await fetch('/api/websites', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ websiteId: website.id, username: session.username })
                    });
                    if (res.ok) {
                        setWebsites(sites => sites.filter(s => s.id !== website.id));
                    } else { throw new Error('Failed to delete'); }
                } catch (e) { alert("An error occurred while deleting the website."); }
            }
        } else if (action === 'unpublish') {
             if (window.confirm(`Are you sure you want to unpublish "${website.name}"? All its pages will be taken offline.`)) {
                try {
                    const res = await fetch('/api/unpublish', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ websiteId: website.id, username: session.username })
                    });
                    if (res.ok) {
                        await fetchWebsites(); // Refresh data to show new status
                    } else { throw new Error('Failed to unpublish'); }
                } catch (e) { alert("An error occurred while unpublishing the site."); }
            }
        }
    };
    
    const getSiteStatus = (site: WebsiteData) => site.pages.some(p => !p.isDraft) ? 'published' : 'draft';

    const filteredAndSortedWebsites = useMemo(() => {
        return websites
            .filter(site => {
                const status = getSiteStatus(site);
                const searchMatch = site.name.toLowerCase().includes(searchTerm.toLowerCase());
                const statusMatch = filterStatus === 'all' || status === filterStatus;
                return searchMatch && statusMatch;
            })
            .sort((a, b) => {
                if (sortBy === 'lastUpdatedAt') {
                    return new Date(b.lastUpdatedAt || 0).getTime() - new Date(a.lastUpdatedAt || 0).getTime();
                }
                if (sortBy === 'name') {
                    return a.name.localeCompare(b.name);
                }
                return 0; // createdAt not implemented yet
            });
    }, [websites, searchTerm, filterStatus, sortBy]);

    const handleOpenSettings = (website: WebsiteData) => {
        setSelectedWebsite(website);
        setIsSettingsModalOpen(true);
    };
    
    const handleSettingsSave = (updatedWebsite: WebsiteData) => {
        setWebsites(current => current.map(w => w.id === updatedWebsite.id ? {...w, ...updatedWebsite} : w));
        setIsSettingsModalOpen(false);
    }
    
    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen dashboard-main"><div className="dashboard-spinner"></div></div>;
    }

    const totalPublished = websites.filter(site => getSiteStatus(site) === 'published').length;

    return (
      <div className={`min-h-screen font-sans dashboard-main dashboard ${dashboardTheme}`}>
        <header className="dashboard-header sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                 <h1 className="text-2xl font-bold">Dashboard</h1>
                 <div className="flex items-center gap-4">
                     <button onClick={() => setDashboardTheme(dashboardTheme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full text-gray-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                        {dashboardTheme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
                     </button>
                     <div className="relative group">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold cursor-pointer">
                            {session.username?.charAt(0).toUpperCase()}
                        </div>
                         <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-200 dark:border-slate-700 hidden group-hover:block">
                            <button onClick={onLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                <LogoutIcon className="w-5 h-5 mr-2" /> Logout
                            </button>
                         </div>
                     </div>
                 </div>
            </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
             <div className="mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold">My Websites</h2>
                        <p className="text-base text-gray-500 mt-1">{websites.length} total sites, {totalPublished} published.</p>
                    </div>
                    <button onClick={handleCreateNew} className="flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        <PlusIcon className="w-5 h-5 mr-2" /> New Website
                    </button>
                </div>

                {/* Filters and Controls */}
                <div className="mt-6 flex flex-wrap gap-2 items-center">
                    <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
                        <SearchIcon className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2"/>
                        <input type="text" placeholder="Search sites..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-transparent"/>
                    </div>
                    <select onChange={e => setFilterStatus(e.target.value as any)} className="py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-transparent">
                        <option value="all">All Statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                    </select>
                     <select onChange={e => setSortBy(e.target.value as any)} className="py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-transparent">
                        <option value="lastUpdatedAt">Sort by Last Updated</option>
                        <option value="name">Sort by Name</option>
                    </select>
                    <div className="ml-auto flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-md">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow' : 'text-slate-500'}`}><GridIcon className="w-5 h-5"/></button>
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow' : 'text-slate-500'}`}><ListIcon className="w-5 h-5"/></button>
                    </div>
                </div>
             </div>

             {filteredAndSortedWebsites.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredAndSortedWebsites.map(site => <WebsiteCard key={site.id} site={site} session={session} onAction={handleAction} onSettings={handleOpenSettings} navigate={navigate} />)}
                    </div>
                ) : (
                    <div className="space-y-3">
                         {filteredAndSortedWebsites.map(site => <WebsiteListItem key={site.id} site={site} session={session} onAction={handleAction} onSettings={handleOpenSettings} navigate={navigate} />)}
                    </div>
                )
             ) : (
                <div className="dashboard-center-state">
                    <h3 className="text-xl font-semibold">No websites found!</h3>
                    <p className="mt-2 max-w-md text-gray-500">
                        Your search or filter returned no results. Try adjusting your criteria or create a new website.
                    </p>
                </div>
             )}
        </main>
        {isSettingsModalOpen && selectedWebsite && (
            <WebsiteSettingsModal
                website={selectedWebsite}
                onClose={() => setIsSettingsModalOpen(false)}
                onSave={handleSettingsSave}
                session={session}
            />
        )}
      </div>
    );
};

const WebsiteCard: React.FC<{site: WebsiteData, session: Session, onAction: Function, onSettings: Function, navigate: Function}> = ({site, session, onAction, onSettings, navigate}) => {
    const homepage = site.pages.find(p => p.isHomepage) || site.pages[0];
    const status = getSiteStatus(site);
    return (
        <div className="website-card rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
            <div className="website-card-preview relative aspect-[16/9] w-full rounded-t-lg overflow-hidden group">
                <img src={homepage?.heroImageUrl} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                 <button onClick={() => navigate(`/editor/${site.id}`)} className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all text-white opacity-0 group-hover:opacity-100">
                    <PencilIcon className="w-6 h-6 mr-2"/> Edit Site
                 </button>
            </div>
            <div className="p-4 flex-grow flex flex-col">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                         <img src={site.faviconUrl} className="w-5 h-5 object-contain" alt="favicon"/>
                        <h3 className="font-bold text-lg leading-tight">{site.name}</h3>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${status === 'published' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                        {status === 'published' ? <CheckCircleIcon className="w-3.5 h-3.5"/> : <CloudOffIcon className="w-3.5 h-3.5" />}
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                </div>
                <a href={`/${session.username}/${homepage?.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:underline flex items-center mt-1 truncate">
                    {session.username}/{homepage?.slug} <LinkIcon className="w-3 h-3 ml-1"/>
                </a>
                 <div className="mt-3 text-xs text-gray-400">Last updated: {new Date(site.lastUpdatedAt || Date.now()).toLocaleDateString()}</div>
                
                <div className="mt-auto pt-4 flex justify-between items-center text-sm text-gray-500 border-t border-dashed mt-4">
                    <div className="flex items-center gap-1"><TrendingUpIcon className="w-4 h-4"/> {site.analytics?.views} views</div>
                    <div className="flex items-center gap-1"><UsersIcon className="w-4 h-4"/> {site.analytics?.visitors} visitors</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div> SEO: {site.seoScore}%</div>
                </div>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-b-lg border-t dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1">
                   {site.tags?.slice(0, 2).map(tag => <span key={tag} className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">{tag}</span>)}
                </div>
                <ActionMenu site={site} onAction={onAction} onSettings={onSettings} status={status}/>
            </div>
        </div>
    );
};

const WebsiteListItem: React.FC<{site: WebsiteData, session: Session, onAction: Function, onSettings: Function, navigate: Function}> = ({site, session, onAction, onSettings, navigate}) => {
    const homepage = site.pages.find(p => p.isHomepage) || site.pages[0];
    const status = getSiteStatus(site);
    return (
        <div className="website-card p-4 rounded-lg flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <img src={homepage?.heroImageUrl} className="w-16 h-10 object-cover rounded-md bg-slate-200"/>
                <div>
                    <h3 className="font-bold">{site.name}</h3>
                    <a href={`/${session.username}/${homepage?.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-500 hover:underline flex items-center truncate">
                        {session.username}/{homepage?.slug} <LinkIcon className="w-3 h-3 ml-1"/>
                    </a>
                </div>
            </div>
             <div className="hidden md:flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${status === 'published' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}">
                {status === 'published' ? <CheckCircleIcon className="w-3.5 h-3.5"/> : <CloudOffIcon className="w-3.5 h-3.5" />}
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
            <div className="hidden lg:block text-sm text-gray-500">Last updated: {new Date(site.lastUpdatedAt || Date.now()).toLocaleDateString()}</div>
            <div className="flex items-center gap-2">
                <button onClick={() => navigate(`/editor/${site.id}`)} className="px-3 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Edit</button>
                <ActionMenu site={site} onAction={onAction} onSettings={onSettings} status={status} />
            </div>
        </div>
    )
}

const ActionMenu: React.FC<{site: WebsiteData, onAction: Function, onSettings: Function, status: string}> = ({site, onAction, onSettings, status}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"><MoreVerticalIcon className="w-5 h-5"/></button>
            {isOpen && (
                 <div className="kebab-menu-dropdown w-48 rounded-md shadow-lg text-sm py-1">
                    <button onClick={() => { onSettings(site); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700"><SettingsIcon className="w-4 h-4"/> Settings</button>
                    {status === 'published' && <button onClick={() => { onAction('unpublish', site); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700"><CloudOffIcon className="w-4 h-4"/> Unpublish</button>}
                    <div className="my-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                    <button onClick={() => { onAction('duplicate', site); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700"><DuplicateIcon className="w-4 h-4"/> Duplicate</button>
                    <button onClick={() => { onAction('delete', site); setIsOpen(false); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"><TrashIcon className="w-4 h-4"/> Delete</button>
                 </div>
            )}
        </div>
    );
};

const getSiteStatus = (site: WebsiteData) => site.pages.some(p => !p.isDraft) ? 'published' : 'draft';


export default WebsiteDashboard;