import React from 'react';
import type { WebsiteData, Theme, GlobalColor, GlobalTypography } from '../types';
import type { Updater } from 'use-immer';
import { PlusIcon, TrashIcon, PencilIcon } from './icons';
import { v4 as uuidv4 } from 'uuid';

interface GlobalSettingsFormProps {
  websiteData: WebsiteData;
  setWebsiteData: Updater<WebsiteData | null>;
  onAddSection: (context: 'page' | 'header' | 'footer') => void;
  onSetEditingContext: (context: 'page' | 'header' | 'footer') => void;
}

const GlobalSettingsForm: React.FC<GlobalSettingsFormProps> = ({ websiteData, setWebsiteData, onAddSection, onSetEditingContext }) => {
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
  
    const handleGlobalColorChange = (id: string, field: 'name' | 'value', value: string) => {
        setWebsiteData(draft => {
            if (!draft || !draft.globalStyles) return;
            const color = draft.globalStyles.colors.find(c => c.id === id);
            if (color) {
                color[field] = value;
            }
        });
    };

    const addGlobalColor = () => {
        setWebsiteData(draft => {
            if (!draft) return;
            if (!draft.globalStyles) draft.globalStyles = { colors: [], typography: [] };
            draft.globalStyles.colors.push({ id: uuidv4(), name: 'New Color', value: '#000000' });
        });
    };
    
    const removeGlobalColor = (id: string) => {
        setWebsiteData(draft => {
             if (!draft || !draft.globalStyles) return;
             draft.globalStyles.colors = draft.globalStyles.colors.filter(c => c.id !== id);
        });
    }
    
    const addGlobalTypography = () => {
        setWebsiteData(draft => {
            if (!draft) return;
            if (!draft.globalStyles) draft.globalStyles = { colors: [], typography: [] };
            draft.globalStyles.typography.push({ id: uuidv4(), name: 'New Style', styles: { desktop: {}, tablet: {}, mobile: {} } });
        });
    }

  const themes: {id: Theme, name: string}[] = [
      {id: 'light', name: 'Light'},
      {id: 'dark', name: 'Dark'},
      {id: 'ocean', name: 'Ocean'},
      {id: 'forest', name: 'Forest'},
  ];

  const googleFonts = [ 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro', 'Raleway', 'Poppins', 'Nunito', 'Merriweather' ];
  const customCursors = [ 'default', 'pointer', 'text', 'wait', 'help', 'crosshair', 'move', 'grab', 'zoom-in', 'zoom-out' ];

  return (
    <div className="p-4 space-y-6">
       <div>
          <h3 className="text-lg font-semibold mb-2 text-slate-700">Global Regions</h3>
           <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onSetEditingContext('header')} className="p-3 bg-slate-50 border rounded-md text-slate-700 font-medium hover:bg-slate-100 hover:border-slate-300">Edit Header</button>
              <button onClick={() => onSetEditingContext('footer')} className="p-3 bg-slate-50 border rounded-md text-slate-700 font-medium hover:bg-slate-100 hover:border-slate-300">Edit Footer</button>
           </div>
       </div>
        <div>
            <h3 className="text-lg font-semibold mb-2 text-slate-700">Global Styles</h3>
            {/* Global Colors */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-slate-600">Colors</h4>
                    <button onClick={addGlobalColor} className="text-indigo-600 hover:text-indigo-800"><PlusIcon className="w-5 h-5"/></button>
                </div>
                <div className="space-y-2">
                    {websiteData.globalStyles?.colors.map(color => (
                        <div key={color.id} className="flex items-center gap-2">
                            <input type="color" value={color.value} onChange={e => handleGlobalColorChange(color.id, 'value', e.target.value)} className="w-8 h-8 p-0 border-none rounded" />
                            <input type="text" value={color.name} onChange={e => handleGlobalColorChange(color.id, 'name', e.target.value)} className="flex-grow p-1 border rounded text-sm"/>
                            <button onClick={() => removeGlobalColor(color.id)}><TrashIcon className="w-4 h-4 text-red-500"/></button>
                        </div>
                    ))}
                </div>
            </div>
             {/* Global Typography */}
            <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-slate-600">Typography</h4>
                    <button onClick={addGlobalTypography} className="text-indigo-600 hover:text-indigo-800"><PlusIcon className="w-5 h-5"/></button>
                </div>
                 <div className="space-y-2">
                     {websiteData.globalStyles?.typography.map(typo => (
                        <div key={typo.id} className="p-2 border rounded text-sm flex justify-between items-center">
                            <span>{typo.name}</span>
                            <button><PencilIcon className="w-4 h-4"/></button>
                        </div>
                     ))}
                 </div>
            </div>
        </div>

      <div>
        <h3 className="text-lg font-semibold mb-2 text-slate-700">General Settings</h3>
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
                <label className="text-sm font-medium text-slate-600 block mb-1">Google Font</label>
                <select value={websiteData.googleFont || 'Roboto'} onChange={e => handleInputChange('googleFont', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm">
                    {googleFonts.map(font => <option key={font} value={font}>{font}</option>)}
                </select>
             </div>
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
           <div>
                <label className="text-sm font-medium text-slate-600 block mb-1">Custom Head Code</label>
                <textarea
                    value={websiteData.customHeadCode || ''}
                    onChange={(e) => handleInputChange('customHeadCode', e.target.value)}
                    className="w-full h-24 p-2 border rounded-md font-mono text-xs"
                    placeholder={`<script src="..."></script>`}
                />
                 <p className="text-xs text-slate-500 mt-1">Add scripts like Google Analytics. This code will be added to every page.</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettingsForm;