
import React, { useState } from 'react';
import type { WebsiteData } from '../types';
import { XIcon, LinkIcon } from './icons';

interface PublishModalProps {
  username: string;
  websiteData: WebsiteData;
  onClose: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({ username, websiteData, onClose }) => {
  const [slug, setSlug] = useState(websiteData.slug || 'home');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successUrl, setSuccessUrl] = useState('');

  const handlePublish = async () => {
    setIsLoading(true);
    setError('');
    setSuccessUrl('');

    // Basic slug validation
    const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!sanitizedSlug) {
        setError('Please enter a valid URL path (e.g., "about-us" or "home").');
        setIsLoading(false);
        return;
    }
    setSlug(sanitizedSlug);
    
    const dataToPublish = { ...websiteData, slug: sanitizedSlug };

    try {
        const response = await fetch('/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, websiteData: dataToPublish }),
        });
        
        const result = await response.json();

        if (response.ok && result.success) {
            setSuccessUrl(`${window.location.origin}${result.url}`);
        } else {
            setError(result.message || 'An unexpected error occurred.');
        }

    } catch (e) {
        setError('Could not connect to the server.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Publish Your Website</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
            {successUrl ? (
                <div className="text-center">
                    <h3 className="text-lg font-semibold text-green-700">Published Successfully!</h3>
                    <p className="mt-2 text-slate-600">Your website is now live at:</p>
                    <div className="mt-4 flex items-center border rounded-md p-2 bg-slate-50">
                        <LinkIcon className="w-5 h-5 text-slate-400 mr-2"/>
                        <a href={successUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-medium break-all">{successUrl}</a>
                    </div>
                     <button
                        onClick={onClose}
                        className="mt-6 w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded hover:bg-indigo-700"
                    >
                        Close
                    </button>
                </div>
            ) : (
                <>
                    <p className="text-slate-600 mb-4">Set a URL path for your website. Use "home" for your main page.</p>
                    <div>
                        <label htmlFor="slug" className="text-sm font-medium text-slate-700 block mb-2">URL Path</label>
                        <div className="flex items-center">
                            <span className="text-slate-500 bg-slate-100 p-2 rounded-l-md border border-r-0">/{username}/</span>
                            <input
                                id="slug"
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-r-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="home"
                            />
                        </div>
                    </div>
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    <div className="mt-6">
                        <button
                            onClick={handlePublish}
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded hover:bg-indigo-700 disabled:bg-indigo-400"
                        >
                            {isLoading ? 'Publishing...' : 'Publish'}
                        </button>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default PublishModal;
