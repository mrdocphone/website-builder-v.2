import React, { useState, useCallback } from 'react';
import type { WebsiteData, Theme, Section, SectionType } from '../types';
import Preview from './Preview';
import { generateSectionContent } from '../services/geminiService';
import { 
    MagicWandIcon, LinkIcon, ClipboardCopyIcon, XIcon, PlusIcon, TrashIcon, 
    ArrowUpIcon, ArrowDownIcon, PencilIcon, AboutIcon, ServicesIcon, GalleryIcon,
    TestimonialsIcon, ContactIcon, LogoutIcon
} from './icons';
import { v4 as uuidv4 } from 'uuid';

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
}

const PublishModal: React.FC<{ url: string; onClose: () => void }> = ({ url, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
          <XIcon className="w-6 h-6" />
        </button>
        <div className="flex items-center mb-4">
          <div className="bg-green-100 p-2 rounded-full mr-3">
            <LinkIcon className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Your Website is Published!</h2>
        </div>
        <p className="text-slate-600 mb-4">Anyone with the link can now view your site. Share it with the world!</p>
        <div className="flex items-center space-x-2 bg-slate-100 p-3 rounded-md border border-slate-200">
          <input type="text" readOnly value={url} className="flex-grow bg-transparent outline-none text-slate-700" />
          <button onClick={handleCopy} className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <ClipboardCopyIcon className="w-5 h-5 inline-block mr-1"/>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

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

const Editor: React.FC<EditorProps> = ({ websiteData, setWebsiteData, onLogout }) => {
  const [isGenerating, setIsGenerating] = useState<string | null>(null); // section ID
  const [error, setError] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'slug') {
      const slugified = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setWebsiteData(prev => ({ ...prev, slug: slugified }));
    } else {
      setWebsiteData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleThemeChange = (theme: Theme) => {
    setWebsiteData(prev => ({ ...prev, theme }));
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setWebsiteData(prev => ({...prev, heroImageUrl: reader.result as string}));
      }
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = () => {
    try {
      const slugify = (text: string) => (text || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const slug = websiteData.slug && websiteData.slug.trim() !== '' 
        ? websiteData.slug 
        : slugify(websiteData.businessName);

      // Update state in case we had to generate a slug from an empty field
      if (slug !== websiteData.slug) {
        setWebsiteData(prev => ({ ...prev, slug }));
      }

      const dataToPublish = { ...websiteData, slug };
      const jsonString = JSON.stringify(dataToPublish);
      const base64String = window.btoa(encodeURIComponent(jsonString));
      const url = `${window.location.origin}${window.location.pathname}#/site/${slug}--${base64String}`;
      
      setPublishedUrl(url);
      window.open(url, '_blank', 'noopener,noreferrer');
      setShowPublishModal(true);
    } catch(e) {
      console.error("Failed to publish", e);
      setError("Could not generate the shareable link. The website data might be too large.")
    }
  };

  const handleAddSection = (type: SectionType) => {
    const newSection: Section = {
      id: uuidv4(),
      type: type,
      content: SECTION_DEFAULTS[type] as any,
    };
    setWebsiteData(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
    setShowAddSectionModal(false);
    setEditingSectionId(newSection.id);
  };

  const handleRemoveSection = (sectionId: string) => {
    if (window.confirm("Are you sure you want to delete this section?")) {
        setWebsiteData(prev => ({
            ...prev,
            sections: prev.sections.filter(s => s.id !== sectionId)
        }));
    }
  }

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
      const index = websiteData.sections.findIndex(s => s.id === sectionId);
      if (index === -1) return;

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= websiteData.sections.length) return;

      const newSections = [...websiteData.sections];
      const [movedSection] = newSections.splice(index, 1);
      newSections.splice(newIndex, 0, movedSection);
      
      setWebsiteData(prev => ({...prev, sections: newSections}));
  }

  const handleSectionContentChange = (sectionId: string, newContent: any) => {
      setWebsiteData(prev => ({
          ...prev,
          sections: prev.sections.map(s => s.id === sectionId ? {...s, content: newContent} : s)
      }));
  };

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
}, [websiteData]);

const renderSectionForm = (section: Section) => {
    const content = section.content as any;
    const isSectionGenerating = isGenerating === section.id;
    
    const baseInput = "w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm";
    const baseLabel = "text-sm font-medium text-slate-600 block mb-1";

    const handleItemChange = (itemId: string, field: string, value: string) => {
        const key = section.type === 'services' ? 'services' : section.type === 'gallery' ? 'images' : 'testimonials';
        const items = content[key];
        const updatedItems = items.map((item: any) => item.id === itemId ? { ...item, [field]: value } : item);
        handleSectionContentChange(section.id, { ...content, [key]: updatedItems });
    };

    const handleAddItem = () => {
        let newItem;
        let key;
        switch(section.type) {
            case 'services':
                newItem = { id: uuidv4(), name: 'New Service', description: 'Describe this service.'};
                key = 'services';
                break;
            case 'gallery':
                newItem = { id: uuidv4(), url: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 100)}`, alt: 'New image' };
                key = 'images';
                break;
            case 'testimonials':
                newItem = { id: uuidv4(), quote: 'A new glowing review!', author: 'New Customer' };
                key = 'testimonials';
                break;
            default: return;
        }
        handleSectionContentChange(section.id, { ...content, [key]: [...content[key], newItem] });
    };

    const handleRemoveItem = (itemId: string) => {
        const key = section.type === 'services' ? 'services' : section.type === 'gallery' ? 'images' : 'testimonials';
        const updatedItems = content[key].filter((item: any) => item.id !== itemId);
        handleSectionContentChange(section.id, { ...content, [key]: updatedItems });
    };

    return (
        <div className="p-4 border-t border-slate-200 mt-3 bg-slate-50">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-700 text-base">Editing: <span className="capitalize">{section.type}</span></h3>
                <button onClick={() => handleGenerateContent(section)} disabled={isSectionGenerating} className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 disabled:cursor-wait">
                    <MagicWandIcon className="w-4 h-4 mr-1"/>
                    {isSectionGenerating ? 'Generating...' : 'Generate with AI'}
                </button>
            </div>

            <div className="space-y-4">
                {'title' in content && (
                    <div>
                        <label className={baseLabel}>Section Title</label>
                        <input type="text" value={content.title} onChange={e => handleSectionContentChange(section.id, {...content, title: e.target.value})} className={baseInput} />
                    </div>
                )}

                {section.type === 'about' && (
                     <div>
                        <label className={baseLabel}>Body</label>
                        <textarea value={content.body} onChange={e => handleSectionContentChange(section.id, {...content, body: e.target.value})} rows={6} className={baseInput} />
                    </div>
                )}
                
                {section.type === 'services' && content.services.map((service: any) => (
                    <div key={service.id} className="p-3 border border-slate-200 rounded-md bg-white relative">
                        <button onClick={() => handleRemoveItem(service.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                        <div className="space-y-2">
                           <div>
                                <label className={baseLabel}>Service Name</label>
                                <input type="text" value={service.name} onChange={e => handleItemChange(service.id, 'name', e.target.value)} className={baseInput} />
                           </div>
                           <div>
                                <label className={baseLabel}>Description</label>
                                <textarea value={service.description} onChange={e => handleItemChange(service.id, 'description', e.target.value)} rows={2} className={baseInput} />
                           </div>
                        </div>
                    </div>
                ))}

                {section.type === 'gallery' && content.images.map((image: any) => (
                    <div key={image.id} className="p-3 border border-slate-200 rounded-md bg-white relative">
                        <button onClick={() => handleRemoveItem(image.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                        <div className="space-y-2">
                           <div>
                                <label className={baseLabel}>Image URL</label>
                                <input type="text" value={image.url} onChange={e => handleItemChange(image.id, 'url', e.target.value)} className={baseInput} />
                           </div>
                           <div>
                                <label className={baseLabel}>Alt Text (for accessibility)</label>
                                <input type="text" value={image.alt} onChange={e => handleItemChange(image.id, 'alt', e.target.value)} className={baseInput} />
                           </div>
                        </div>
                    </div>
                ))}
                
                {section.type === 'testimonials' && content.testimonials.map((testimonial: any) => (
                    <div key={testimonial.id} className="p-3 border border-slate-200 rounded-md bg-white relative">
                         <button onClick={() => handleRemoveItem(testimonial.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4"/></button>
                        <div className="space-y-2">
                           <div>
                                <label className={baseLabel}>Quote</label>
                                <textarea value={testimonial.quote} onChange={e => handleItemChange(testimonial.id, 'quote', e.target.value)} rows={3} className={baseInput} />
                           </div>
                           <div>
                                <label className={baseLabel}>Author</label>
                                <input type="text" value={testimonial.author} onChange={e => handleItemChange(testimonial.id, 'author', e.target.value)} className={baseInput} />
                           </div>
                        </div>
                    </div>
                ))}

                {(section.type === 'services' || section.type === 'gallery' || section.type === 'testimonials') && (
                    <button onClick={handleAddItem} className="w-full text-sm text-indigo-600 border-2 border-dashed border-slate-300 rounded-md py-2 hover:bg-indigo-50 hover:border-indigo-500">
                       + Add {section.type === 'services' ? 'Service' : section.type === 'gallery' ? 'Image' : 'Testimonial'}
                    </button>
                )}

                {section.type === 'contact' && (
                    <div className="space-y-2">
                        <div><label className={baseLabel}>Address</label><input type="text" value={content.address} onChange={e => handleSectionContentChange(section.id, {...content, address: e.target.value})} className={baseInput} /></div>
                        <div><label className={baseLabel}>Phone</label><input type="text" value={content.phone} onChange={e => handleSectionContentChange(section.id, {...content, phone: e.target.value})} className={baseInput} /></div>
                        <div><label className={baseLabel}>Email</label><input type="email" value={content.email} onChange={e => handleSectionContentChange(section.id, {...content, email: e.target.value})} className={baseInput} /></div>
                    </div>
                )}
            </div>
        </div>
    )
}

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
            <button
              onClick={handlePublish}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Publish & Share
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

        {/* Form Sections */}
        <div className="space-y-6">
          
          {/* Business Info */}
          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
            <h2 className="font-semibold text-slate-700 mb-3">Global Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">Business Name</label>
                <input type="text" name="businessName" value={websiteData.businessName} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">Tagline</label>
                <input type="text" name="tagline" value={websiteData.tagline} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
               <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">Website Slug</label>
                <input type="text" name="slug" value={websiteData.slug} onChange={handleInputChange} placeholder="my-cool-business" className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
                <p className="text-xs text-slate-500 mt-1">Used for the shareable URL. Lowercase letters, numbers, and dashes only.</p>
              </div>
               <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">Hero Image</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
              </div>
            </div>
          </div>
          
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
                   <div key={section.id} className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                       <div className="flex items-center justify-between">
                           <span className="font-medium text-slate-600 capitalize">{section.type}</span>
                           <div className="flex items-center space-x-2">
                               <button onClick={() => handleMoveSection(section.id, 'up')} disabled={index === 0} className="disabled:opacity-30"><ArrowUpIcon className="w-5 h-5 text-slate-500 hover:text-slate-800"/></button>
                               <button onClick={() => handleMoveSection(section.id, 'down')} disabled={index === websiteData.sections.length - 1} className="disabled:opacity-30"><ArrowDownIcon className="w-5 h-5 text-slate-500 hover:text-slate-800"/></button>
                               <button onClick={() => setEditingSectionId(editingSectionId === section.id ? null : section.id)}><PencilIcon className={`w-5 h-5 transition-colors ${editingSectionId === section.id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`} /></button>
                               <button onClick={() => handleRemoveSection(section.id)}><TrashIcon className="w-5 h-5 text-red-400 hover:text-red-600"/></button>
                           </div>
                       </div>
                       {editingSectionId === section.id && renderSectionForm(section)}
                   </div>
                ))}
                 {error && <p className="text-xs text-red-500 mt-2 p-1 bg-red-50 rounded-md">{error}</p>}
            </div>
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
            <Preview websiteData={websiteData} />
        </div>
      </main>
    </div>
    </>
  );
};

export default Editor;