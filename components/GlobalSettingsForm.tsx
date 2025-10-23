import React, { useState, useEffect } from 'react';
import type { WebsiteData, Theme } from '../types';

interface GlobalSettingsFormProps {
  websiteData: WebsiteData;
  onDataChange: (updates: Partial<WebsiteData>) => void;
}

const GlobalSettingsForm: React.FC<GlobalSettingsFormProps> = ({ websiteData, onDataChange }) => {
  const [settings, setSettings] = useState({
    businessName: websiteData.businessName,
    tagline: websiteData.tagline,
  });

  useEffect(() => {
    setSettings({
      businessName: websiteData.businessName,
      tagline: websiteData.tagline,
    });
  }, [websiteData.businessName, websiteData.tagline]);

  useEffect(() => {
    if (settings.businessName === websiteData.businessName && settings.tagline === websiteData.tagline) {
        return;
    }
    const handler = setTimeout(() => {
      onDataChange(settings);
    }, 400);
    return () => clearTimeout(handler);
  }, [settings, onDataChange, websiteData.businessName, websiteData.tagline]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleThemeChange = (theme: Theme) => {
    onDataChange({ theme });
  };
  
  const themes: { id: Theme; label: string; colors: string[] }[] = [
    { id: 'light', label: 'Light', colors: ['bg-white', 'bg-slate-200', 'bg-slate-800'] },
    { id: 'dark', label: 'Dark', colors: ['bg-gray-800', 'bg-gray-600', 'bg-white'] },
    { id: 'ocean', label: 'Ocean', colors: ['bg-white', 'bg-ocean-blue-500', 'bg-ocean-blue-900'] },
    { id: 'forest', label: 'Forest', colors: ['bg-white', 'bg-forest-green-500', 'bg-forest-green-900'] },
  ];

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="font-semibold text-slate-800 text-lg mb-3">Global Site Settings</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Business Name</label>
            <input type="text" name="businessName" value={settings.businessName} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 block mb-1">Tagline</label>
            <input type="text" name="tagline" value={settings.tagline} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
        </div>
      </div>
       <div>
        <h3 className="font-semibold text-slate-700 mb-3">Theme</h3>
        <div className="grid grid-cols-2 gap-4">
          {themes.map(theme => (
            <button key={theme.id} onClick={() => handleThemeChange(theme.id)} className={`p-3 rounded-md border-2 ${websiteData.theme === theme.id ? 'border-indigo-500' : 'border-slate-200'}`}>
              <div className="flex items-center space-x-2">
                {theme.colors.map((color, i) => <div key={i} className={`w-5 h-5 rounded-full ${color}`}></div>)}
                <span className="text-sm font-medium text-slate-600">{theme.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(GlobalSettingsForm);
