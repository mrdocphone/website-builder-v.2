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

  const googleFonts = [ 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro', 'Raleway', 'Poppins', 'Nunito Sans', 'Merriweather' ];

  return (
    <div className="p-4 space-y-6">
      <div>
        <label className="text-sm font-medium text-slate-600 block mb-2">Website Name</label>
        <input
          type="text"
          value={websiteData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full p-2 border border-slate-300 rounded-md"
        />
      </div>

       <div>
        <label className="text-sm font-medium text-slate-600 block mb-2">Global Header & Footer</label>
         <div className="flex gap-2">
            <button onClick={() => onSetEditingContext('header')} className="flex-1 text-center p-2 bg-white border rounded-md hover:bg-slate-50">Edit Header</button>
            <button onClick={() => onSetEditingContext('footer')} className="flex-1 text-center p-2 bg-white border rounded-md hover:bg-slate-50">Edit Footer</button>
         </div>
      </div>
      
       <div>
        <label className="text-sm font-medium text-slate-600 block mb-2">Theme</label>
        <div className="grid grid-cols-2 gap-2">
            {themes.map(theme => (
                 <button key={theme.id} onClick={() => handleThemeChange(theme.id)} className={`p-2 rounded-md border-2 ${websiteData.theme === theme.id ? 'border-indigo-500 bg-indigo-50' : 'border-transparent bg-slate-100'}`}>
                    {theme.name}
                 </button>
            ))}
        </div>
      </div>
      
       <div>
            <label className="text-sm font-medium text-slate-600 block mb-2">Favicon URL</label>
            <input type="text" value={websiteData.faviconUrl || ''} onChange={(e) => handleInputChange('faviconUrl', e.target.value)} className="w-full p-2 border border-slate-300 rounded-md"/>
      </div>
      
       <div>
            <label className="text-sm font-medium text-slate-600 block mb-2">Google Font</label>
            <select value={websiteData.googleFont || ''} onChange={e => handleInputChange('googleFont', e.target.value)} className="w-full p-2 border border-slate-300 rounded-md bg-white">
                <option value="">Default</option>
                {googleFonts.map(font => <option key={font} value={font}>{font}</option>)}
            </select>
       </div>
      
       <div>
            <label className="text-sm font-medium text-slate-600 block mb-2">Custom Code (Site-wide)</label>
            <textarea
                value={websiteData.customHeadCode || ''}
                onChange={e => handleInputChange('customHeadCode', e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md font-mono text-xs"
                placeholder="e.g. <style> or <script> tags for the <head>"
                rows={4}
            />
       </div>

      <div>
        <h3 className="text-sm font-medium text-slate-600 block mb-2">Global Colors</h3>
        <div className="space-y-2">
            {websiteData.globalStyles.colors.map(color => (
                <div key={color.id} className="flex items-center gap-2">
                    <input type="color" value={color.value} onChange={e => handleGlobalColorChange(color.id, 'value', e.target.value)} className="p-0.5 h-8 w-8 border rounded" />
                    <input type="text" value={color.name} onChange={e => handleGlobalColorChange(color.id, 'name', e.target.value)} className="flex-grow p-1.5 border rounded" />
                    <button onClick={() => removeGlobalColor(color.id)} className="p-1.5 hover:bg-red-50 rounded"><TrashIcon className="w-4 h-4 text-red-500"/></button>
                </div>
            ))}
        </div>
        <button onClick={addGlobalColor} className="mt-2 text-indigo-600 text-sm font-semibold flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Color</button>
      </div>
    </div>
  );
};

export default GlobalSettingsForm;
