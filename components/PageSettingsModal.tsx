import React, { useState } from 'react';
import type { Page } from '../types';

interface PageSettingsModalProps {
    page: Page;
    onClose: () => void;
    onSave: (updates: Partial<Page>) => void;
}

const PageSettingsModal: React.FC<PageSettingsModalProps> = ({ page, onClose, onSave }) => {
    const [name, setName] = useState(page.name);
    const [slug, setSlug] = useState(page.slug);
    const [isDraft, setIsDraft] = useState(page.isDraft || false);
    const [password, setPassword] = useState(page.password || '');
    const [metaTitle, setMetaTitle] = useState(page.metaTitle || '');
    const [metaDescription, setMetaDescription] = useState(page.metaDescription || '');
    const [ogImageUrl, setOgImageUrl] = useState(page.ogImageUrl || '');

    const handleSave = () => {
        onSave({ name, slug, isDraft, password, metaTitle, metaDescription, ogImageUrl });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Page Settings: {page.name}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* General Settings */}
                    <div className="p-4 border rounded">
                         <h3 className="font-semibold mb-2">General</h3>
                         <div>
                            <label className="text-sm font-medium text-slate-600 block mb-1">Page Name</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-600 block mb-1">URL Slug</label>
                            <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className="w-full p-2 border rounded"/>
                        </div>
                    </div>
                    
                     {/* Publishing & Security */}
                     <div className="p-4 border rounded">
                         <h3 className="font-semibold mb-2">Publishing & Security</h3>
                         <div className="flex items-center">
                            <input id="isDraft" type="checkbox" checked={isDraft} onChange={(e) => setIsDraft(e.target.checked)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded"/>
                            <label htmlFor="isDraft" className="ml-2 block text-sm text-slate-700">Mark as Draft (hide from published site)</label>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-slate-600 block mb-1 mt-2">Password Protection</label>
                            <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" placeholder="Leave empty for no password"/>
                        </div>
                     </div>

                    {/* SEO & Social */}
                    <div className="p-4 border rounded">
                         <h3 className="font-semibold mb-2">SEO & Social Share</h3>
                        <div>
                            <label className="text-sm font-medium text-slate-600 block mb-1">Meta Title</label>
                            <input type="text" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} className="w-full p-2 border rounded"/>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-600 block mb-1">Meta Description</label>
                            <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} className="w-full p-2 border rounded h-20"/>
                        </div>
                         <div>
                            <label className="text-sm font-medium text-slate-600 block mb-1">Social Share Image URL</label>
                            <input type="text" value={ogImageUrl} onChange={e => setOgImageUrl(e.target.value)} className="w-full p-2 border rounded"/>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded text-slate-600 bg-white border">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded text-white bg-indigo-600">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default PageSettingsModal;
