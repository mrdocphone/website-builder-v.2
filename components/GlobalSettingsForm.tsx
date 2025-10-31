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

  const handlePaletteChange = (colorName: keyof WebsiteData['palette'], value: string) => {
      setWebsiteData(draft => {
          if (draft) draft.palette[colorName] = value;
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
            <label className="text-sm font-medium text-slate-600 block mb-1">Tagline</label>
            <input
              type="text"
              value={websiteData.tagline}
              onChange={(e) => handleInputChange('tagline', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
            />
          </div>
           <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Hero Image URL</label>
            <input
              type="text"
              value={websiteData.heroImageUrl}
              onChange={(e) => handleInputChange('heroImageUrl', e.target.value)}
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
            {/* FIX: Renamed `key` to `paletteKey` to avoid conflict with React's reserved `key` prop, which was causing a TypeScript inference issue. */}
            {(Object.keys(websiteData.palette) as Array<keyof typeof websiteData.palette>).map(paletteKey => (
                <div key={paletteKey}>
                    <label className="text-sm font-medium text-slate-600 block mb-1 capitalize">{paletteKey}</label>
                    <input type="color" value={websiteData.palette[paletteKey]} onChange={e => handlePaletteChange(paletteKey, e.target.value)} className="w-full h-10 p-1 border border-slate-300 rounded-md"/>
                </div>
            ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2 text-slate-700">Content Sections</h3>
        <button
          onClick={onAddSection}
          className="w-full flex items-center justify-center bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded hover:bg-slate-300"
        >
            <PlusIcon className="w-5 h-5 mr-2"/>
            Add Section
        </button>
      </div>
    </div>
  );
};

export default GlobalSettingsForm;
