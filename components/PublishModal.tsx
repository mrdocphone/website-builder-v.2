
import React, { useState } from 'react';
import type { WebsiteData } from '../types';
import { XIcon, LinkIcon } from './icons';

interface PublishModalProps {
  username: string;
  websiteData: WebsiteData;
  onClose: () => void;
  onPublishSuccess: (updatedData: WebsiteData) => void;
}

const PublishModal: React.FC<PublishModalProps> = ({ username, websiteData, onClose, onPublishSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successUrl, setSuccessUrl] = useState('');

  const handlePublish = async () => {
    setIsLoading(true);
    setError('');
    setSuccessUrl('');

    try {
        const response = await fetch('/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, websiteData }),
        });
        
        const result = await response.json();

        if (response.ok && result.success) {
            setSuccessUrl(`${window.location.origin}${result.url}`);
            onPublishSuccess(websiteData);
        } else {
            setError(result.message || 'An unexpected error occurred.');
        }

    } catch (e) {
        setError('Could not connect to the server.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const homepage = websiteData.pages.find(p => p.isHomepage) || websiteData.pages[0];

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
                    <p className="mt-2 text-slate-600">Your homepage is now live at:</p>
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
                    <p className="text-slate-600 mb-4">You are about to publish your entire website. Your homepage is set to:</p>
                    <div className="p-2 bg-slate-100 rounded-md text-center font-medium text-slate-700">
                        {homepage?.name || "N/A"} (<span className="font-mono text-sm">/{homepage?.slug}</span>)
                    </div>
                    {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}
                    <div className="mt-6">
                        <button
                            onClick={handlePublish}
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded hover:bg-indigo-700 disabled:bg-indigo-400"
                        >
                            {isLoading ? 'Publishing...' : 'Publish Site'}
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
