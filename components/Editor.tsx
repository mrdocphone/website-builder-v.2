import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { WebsiteData, Theme, Section, SectionType } from '../types';
import type { Session } from '../App';
import Preview from './Preview';
import EditorSectionItem from './EditorSectionItem';
import GlobalSettingsForm from './GlobalSettingsForm';
import { generateSectionContent } from '../services/geminiService';
import { 
    LinkIcon, XIcon, PlusIcon,
    AboutIcon, ServicesIcon, GalleryIcon,
    TestimonialsIcon, ContactIcon, LogoutIcon, WarningIcon
} from './icons';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import PublishModal from './PublishModal';

const SECTION_DEFAULTS = {
  about: { title: 'About Us', body: 'This is a new section about your company.' },
  services: { title: 'Our Services', services: [{ id: uuidv4(), name: 'New Service', description: 'Describe the service here.' }] },
  gallery: { title: 'Our Gallery', images: [{ id: uuidv4(), url: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 100)}`, alt: 'placeholder' }] },
  testimonials: { title: 'What Our Clients Say', testimonials: [{ id: uuidv4(), quote: 'This is a fantastic company!', author: 'A Happy Client' }] },
  contact: { title: 'Contact Us', address: '123 Example St', phone: '555-555-5555', email: 'email@example.com' }
};

interface EditorProps {
  websiteData: WebsiteData;
  setWebsiteData: React.Dispatch<React.SetStateAction<WebsiteData>>;
  onLogout: () => void;
  session: Session;
}

const AddSectionModal: React.FC<{ onAdd: (type: SectionType) => void; onClose: () => void; }> = ({ onAdd, onClose }) => {
    const availableSections: { type: SectionType, label: string, icon: React.FC<any> }[] = [
        { type: 'about', label: 'About', icon: AboutIcon },
        { type: 'services', label: 'Services', icon: ServicesIcon },
        { type: 'gallery', label: 'Gallery', icon: GalleryIcon },
        { type: 'testimonials', label: 'Testimonials', icon: TestimonialsIcon },
        { type: 'contact', label: 'Contact', icon: ContactIcon },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Add a New Section</h2>
                <div className="grid grid-cols-2 gap-4">
                    {availableSections.map(({ type, label, icon: Icon }) => (
                        <button key={type} onClick={() => onAdd(type)} className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200">
                           <Icon className="w-8 h-8 mb-2 text-indigo-500" />
                           <span className="text-md font-semibold text-slate-700">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Editor: React.FC<EditorProps> = ({ websiteData, setWebsiteData, onLogout, session }) => {
  const [isGenerating, setIsGenerating] = useState<string | null>(null); // section ID
  const [error, setError] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isKvConfigured, setIsKvConfigured] = useState(true);
  const [isCheckingKv, setIsCheckingKv] = useState(true);
  const navigate = useNavigate();

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedSectionId && sectionRefs.current[selectedSectionId]) {
      sectionRefs.current[selectedSectionId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedSectionId]);


  useEffect(() => {
    const checkKvStatus = async () => {
        setIsCheckingKv(true);
        try {
            const response = await fetch('/api/check-kv');
            if (response.ok) {
                const data = await response.json();
                setIsKvConfigured(data.isConfigured);
            } else {
                setIsKvConfigured(false);
            }
        } catch (e) {
            console.error("Failed to check KV status", e);
            setIsKvConfigured(false);
        } finally {
            setIsCheckingKv(false);
        }
    };
    checkKvStatus();
  }, []);

  const handleThemeChange = useCallback((theme: Theme) => {
    setWebsiteData(prev => ({ ...prev, theme }));
  }, [setWebsiteData]);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    setError(null);
    try {
      const slugify = (text: string) => (text || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const slug = websiteData.slug && websiteData.slug.trim() !== '' 
        ? websiteData.slug 
        : slugify(websiteData.businessName);

      const RESERVED_SLUGS = ['editor', 'site', 'api', 'login', 'admin', 'signup', 'index.html', 'favicon.ico'];
      if (RESERVED_SLUGS.includes(slug) || slug === session.username) {
          throw new Error(`The slug "${slug}" is reserved. Please choose another.`);
      }

      if (slug !== websiteData.slug) {
        setWebsiteData(prev => ({ ...prev, slug }));
      }

      const dataToPublish = { 
          websiteData: { ...websiteData, slug },
          username: session.username,
      };
      
      const response = await fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToPublish)
      });
      
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to publish on the server.");
      }
      
      const url = session.type === 'admin' 
        ? `${window.location.origin}/${slug}`
        : `${window.location.origin}/${session.username}/${slug}`;
      
      setPublishedUrl(url);
      window.open(url, '_blank', 'noopener,noreferrer');
      setShowPublishModal(true);
    } catch(e) {
      console.error("Failed to publish", e);
      setError(e instanceof Error ? e.message : "Could not publish your website.")
    } finally {
        setIsPublishing(false);
    }
  }, [websiteData, session, setWebsiteData]);

  const handleAddSection = useCallback((type: SectionType) => {
    const newSection: Section = {
      id: uuidv4(),
      type: type,
      content: SECTION_DEFAULTS[type] as any,
    };
    setWebsiteData(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
    setShowAddSectionModal(false);
    setSelectedSectionId(newSection.id);
  }, [setWebsiteData]);

  const handleRemoveSection = useCallback((sectionId: string) => {
    if (window.confirm("Are you sure you want to delete this section?")) {
        setWebsiteData(prev => ({
            ...prev,
            sections: prev.sections.filter(s => s.id !== sectionId)
        }));
    }
  }, [setWebsiteData]);

  const handleMoveSection = useCallback((draggedId: string, targetId: string) => {
    setWebsiteData(prev => {
        const draggedIndex = prev.sections.findIndex(s => s.id === draggedId);
        const targetIndex = prev.sections.findIndex(s => s.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return prev;

        const newSections = [...prev.sections];
        const [movedSection] = newSections.splice(draggedIndex, 1);
        newSections.splice(targetIndex, 0, movedSection);
        
        return {...prev, sections: newSections};
    });
  }, [setWebsiteData]);

  const handleSectionContentChange = useCallback((sectionId: string, newContent: any) => {
      setWebsiteData(prev => ({
          ...prev,
          sections: prev.sections.map(s => s.id === sectionId ? {...s, content: newContent} : s)
      }));
  }, [setWebsiteData]);

  const handleGenerateContent = useCallback(async (section: Section) => {
    setIsGenerating(section.id);
    setError(null);
    try {
        const newContent = await generateSectionContent(websiteData, section);
        handleSectionContentChange(section.id, { ...section.content, ...newContent });
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        console.error(err);
    } finally {
        setIsGenerating(null);
    }
  }, [websiteData, handleSectionContentChange]);

  const handleSelectSection = useCallback((sectionId: string) => {
    setSelectedSectionId(prevId => (prevId === sectionId ? null : sectionId));
  }, []);

  const themes: { id: Theme; label: string; colors: string[] }[] = [
    { id: 'light', label: 'Light', colors: ['bg-white', 'bg-slate-200', 'bg-slate-800'] },
    { id: 'dark', label: 'Dark', colors: ['bg-gray-800', 'bg-gray-600', 'bg-white'] },
    { id: 'ocean', label: 'Ocean', colors: ['bg-white', 'bg-ocean-blue-500', 'bg-ocean-blue-900'] },
    { id: 'forest', label: 'Forest', colors: ['bg-white', 'bg-forest-green-500', 'bg-forest-green-900'] },
  ];

  return (
    <>
    {showPublishModal && <PublishModal url={publishedUrl} onClose={() => setShowPublishModal(false)} />}
    {showAddSectionModal && <AddSectionModal onAdd={handleAddSection} onClose={() => setShowAddSectionModal(false)} />}
    <div className="flex flex-col lg:flex-row h-screen font-sans bg-slate-100">
      <aside className="w-full lg:w-[400px] p-6 bg-white border-r border-slate-200 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Gen-Z Builder</h1>
          <div className="flex items-center space-x-2">
            {session.type === 'admin' && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="p-2 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300"
                  title="Back to Admin Dashboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                </button>
            )}
            <button
              onClick={handlePublish}
              disabled={isPublishing || !isKvConfigured || isCheckingKv}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
              title={!isKvConfigured ? "Please configure a storage database to publish your site." : "Publish your website"}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              {isPublishing ? 'Publishing...' : 'Publish & Share'}
            </button>
            <button 
              onClick={onLogout}
              title="Logout"
              className="p-2 bg-slate-200 text-slate-600 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
                <LogoutIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {isCheckingKv ? (
            <div className="p-4 mb-4 text-sm text-slate-700 bg-slate-100 rounded-lg animate-pulse">Checking storage configuration...</div>
        ) : !isKvConfigured && (
            <div className="p-4 mb-4 text-sm bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                         <WarningIcon className="h-5 w-5 text-amber-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="font-bold text-amber-800">Action Required: Connect a Storage Database</h3>
                        <div className="mt-2 text-amber-700">
                            <p className="mb-2">To publish your site, you must connect a Vercel KV store. It's a quick, one-time setup.</p>
                            <ol className="list-decimal list-inside mt-2 space-y-1 font-medium">
                                <li>Go to your Vercel project's <strong>Storage</strong> tab.</li>
                                <li>Find <strong>Upstash</strong> and click <strong>Create</strong>.</li>
                                <li>Follow the prompts to connect it.</li>
                                <li>After connecting, you <strong>must Redeploy</strong> your project.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Form Sections */}
        <div className="space-y-6">
          
          <GlobalSettingsForm websiteData={websiteData} setWebsiteData={setWebsiteData} />
          
          {/* Sections */}
          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-slate-700">Website Sections</h2>
              <button onClick={() => setShowAddSectionModal(true)} className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  <PlusIcon className="w-4 h-4 mr-1"/> Add Section
              </button>
            </div>
            <div className="space-y-2">
                {websiteData.sections.map((section, index) => (
                   <div key={section.id} ref={el => sectionRefs.current[section.id] = el}>
                       <EditorSectionItem
                            section={section}
                            selectedSectionId={selectedSectionId}
                            isGenerating={isGenerating === section.id}
                            onMoveSection={handleMoveSection}
                            onRemoveSection={handleRemoveSection}
                            onSelectSection={handleSelectSection}
                            onContentChange={handleSectionContentChange}
                            onGenerate={handleGenerateContent}
                       />
                   </div>
                ))}
            </div>
             {error && <p className="text-xs text-red-500 mt-2 p-2 bg-red-50 rounded-md border border-red-200">{error}</p>}
          </div>
          
          {/* Theme */}
          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
             <h2 className="font-semibold text-slate-700 mb-3">Theme</h2>
             <div className="grid grid-cols-2 gap-4">
                {themes.map(theme => (
                    <button key={theme.id} onClick={() => handleThemeChange(theme.id)} className={`p-3 rounded-md border-2 ${websiteData.theme === theme.id ? 'border-indigo-500' : 'border-transparent'}`}>
                        <div className="flex items-center space-x-2">
                            {theme.colors.map((color, i) => <div key={i} className={`w-5 h-5 rounded-full ${color}`}></div>)}
                            <span className="text-sm font-medium text-slate-600">{theme.label}</span>
                        </div>
                    </button>
                ))}
             </div>
          </div>

        </div>
      </aside>
      <main className="w-full flex-1 bg-slate-200 p-6 flex items-center justify-center">
        <div className="w-full h-full max-w-full max-h-full bg-white rounded-lg shadow-lg overflow-hidden transform scale-[0.9] origin-center">
            <Preview 
                websiteData={websiteData} 
                selectedSectionId={selectedSectionId}
                onSelectSection={setSelectedSectionId}
            />
        </div>
      </main>
    </div>
    </>
  );
};

export default Editor;