import React, { useState } from 'react';
import { LinkIcon, ClipboardCopyIcon, XIcon } from './icons';

interface PublishModalProps {
    url: string;
    onClose: () => void;
}

const PublishModal: React.FC<PublishModalProps> = ({ url, onClose }) => {
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

export default PublishModal;
