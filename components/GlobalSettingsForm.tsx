import React from 'react';
import type { WebsiteData, Theme } from '../types';
import type { Updater } from 'use-immer';
import { PlusIcon } from './icons';

interface GlobalSettingsFormProps {
  websiteData: WebsiteData;
  setWebsiteData: Updater<WebsiteData | null>;
  onAddSection: () => void;
}

const GlobalSettingsForm: React.FC<GlobalSettingsFormProps> = ({ websiteData, setWebsiteData, onAddSection }) => {
  const handleInputChange = (field: keyof WebsiteData, value: string) => {
    setWebsiteData(draft => {
      if (draft) {
        (draft[field] as any) = value;
      }
    });
  };
  
  const handleThemeChange = (theme: Theme) => {
    setWebsiteData(draft => {
        if(draft) draft.theme = theme;
    })
  }

  // FIX: Updated `colorName` to be a specific key of the palette for better type safety, removing the need for a cast.
  const handlePaletteChange = (colorName: keyof WebsiteData['palette'], value: string) => {
      setWebsiteData(draft => {
          if (draft) {
              draft.palette[colorName] = value;
          }
      })
  }
  
  const themes: {id: Theme, name: string}[] = [
      {id: 'light', name: 'Light'},
      {id: 'dark', name: 'Dark'},
      {id: 'ocean', name: 'Ocean'},
      {id: 'forest', name: 'Forest'},
  ];

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-slate-700">Global Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Website Name</label>
            <input
              type="text"
              value={websiteData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
            />
          </div>
           <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Theme</label>
            <div className="grid grid-cols-2 gap-2">
                {themes.map(theme => (
                    <button 
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id)}
                        className={`p-2 rounded-md border-2 ${websiteData.theme === theme.id ? 'border-indigo-500' : 'border-transparent'}`}
                    >
                       <div className={`w-full h-12 rounded bg-gradient-to-br from-${theme.id === 'light' ? 'white' : theme.id === 'dark' ? 'gray-800' : `${theme.id}-50`} to-${theme.id === 'light' ? 'slate-100' : theme.id === 'dark' ? 'gray-700' : `${theme.id}-200`} flex items-center justify-center`}>
                           <span className={`font-semibold text-sm ${websiteData.theme === theme.id ? 'text-indigo-600' : 'text-slate-700'}`}>{theme.name}</span>
                       </div>
                    </button>
                ))}
            </div>
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2 text-slate-700">Global Colors</h3>
        <div className="grid grid-cols-2 gap-4">
            {/* FIX: Corrected the type assertion for Object.keys to match the expected type in handlePaletteChange, ensuring type safety. */}
            {(Object.keys(websiteData.palette) as (keyof WebsiteData['palette'])[]).map(paletteKey => (
                <div key={paletteKey}>
                    <label className="text-sm font-medium text-slate-600 block mb-1 capitalize">{paletteKey}</label>
                    <input type="color" value={websiteData.palette[paletteKey]} onChange={e => handlePaletteChange(paletteKey, e.target.value)} className="w-full h-10 p-1 border border-slate-300 rounded-md"/>
                </div>
            ))}
        </div>
      </div>
       <div>
        <h3 className="text-lg font-semibold mb-2 text-slate-700">SEO & Metadata</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Favicon URL</label>
            <input
              type="text"
              value={websiteData.faviconUrl || ''}
              onChange={(e) => handleInputChange('faviconUrl', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
              placeholder="/favicon.ico"
            />
          </div>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2 text-slate-700">Content Sections</h3>
        <p className="text-sm text-slate-500 mb-2">To add sections, select a page and use the "Layers" panel.</p>
      </div>
    </div>
  );
};

export default GlobalSettingsForm;