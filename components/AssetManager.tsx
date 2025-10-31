
import React, { useState } from 'react';
import type { WebsiteData } from '../types';
import { PlusIcon, TrashIcon, XIcon } from './icons';

interface AssetManagerProps {
    websiteData: WebsiteData;
    onClose: () => void;
    onUpdateAssets: (assets: WebsiteData['assets']) => void;
    onSelectAsset: (url: string) => void;
}

const AssetManager: React.FC<AssetManagerProps> = ({ websiteData, onClose, onUpdateAssets, onSelectAsset }) => {
    const [newImageUrl, setNewImageUrl] = useState('');

    const handleAddAsset = () => {
        if (newImageUrl.trim()) {
            // FIX: Clean up the URL to generate a better default name
            const cleanedUrl = newImageUrl.split('?')[0].split('#')[0];
            const newAsset = {
                id: `asset-${Date.now()}`,
                name: cleanedUrl.split('/').pop() || 'new-image',
                url: newImageUrl,
            };
            onUpdateAssets([...websiteData.assets, newAsset]);
            setNewImageUrl('');
        }
    };

    const handleRemoveAsset = (assetId: string) => {
        if (window.confirm('Are you sure you want to remove this asset?')) {
            onUpdateAssets(websiteData.assets.filter(a => a.id !== assetId));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">Asset Manager</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {websiteData.assets.map(asset => (
                            <div key={asset.id} className="group relative aspect-square border rounded-md overflow-hidden cursor-pointer" onClick={() => onSelectAsset(asset.url)}>
                                <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRemoveAsset(asset.id);}}
                                        className="p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title={`Remove ${asset.name}`}
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">{asset.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t flex-shrink-0">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            placeholder="Paste image URL here..."
                            className="flex-grow p-2 border rounded"
                        />
                        <button
                            onClick={handleAddAsset}
                            className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center"
                        >
                            <PlusIcon className="w-5 h-5 mr-1" /> Add
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Note: For now, only external image URLs are supported.</p>
                </div>
            </div>
        </div>
    );
};

export default AssetManager;