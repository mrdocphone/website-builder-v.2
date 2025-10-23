import React, { useState, useEffect } from 'react';
import type { WebsiteData } from '../types';

interface GlobalSettingsFormProps {
  websiteData: WebsiteData;
  setWebsiteData: React.Dispatch<React.SetStateAction<WebsiteData>>;
}

const GlobalSettingsForm: React.FC<GlobalSettingsFormProps> = ({ websiteData, setWebsiteData }) => {
  const [settings, setSettings] = useState({
    businessName: websiteData.businessName,
    tagline: websiteData.tagline,
    slug: websiteData.slug,
  });

  // Sync local state if external data changes (e.g., initial load)
  useEffect(() => {
    setSettings({
      businessName: websiteData.businessName,
      tagline: websiteData.tagline,
      slug: websiteData.slug,
    });
  }, [websiteData.businessName, websiteData.tagline, websiteData.slug]);

  // Debounce updates to the parent component to avoid re-renders on every keystroke
  useEffect(() => {
    // Prevent updating on the initial render when states are already in sync
    if (settings.businessName === websiteData.businessName && settings.tagline === websiteData.tagline && settings.slug === websiteData.slug) {
        return;
    }

    const handler = setTimeout(() => {
      setWebsiteData(prev => ({
        ...prev,
        businessName: settings.businessName,
        tagline: settings.tagline,
        slug: settings.slug,
      }));
    }, 400); // 400ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [settings, setWebsiteData, websiteData.businessName, websiteData.tagline, websiteData.slug]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => {
        if (name === 'slug') {
            const slugified = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            return { ...prev, slug: slugified };
        }
        return { ...prev, [name]: value };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setWebsiteData(prev => ({...prev, heroImageUrl: reader.result as string}));
      }
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
      <h2 className="font-semibold text-slate-700 mb-3">Global Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-600 block mb-1">Business Name</label>
          <input type="text" name="businessName" value={settings.businessName} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 block mb-1">Tagline</label>
          <input type="text" name="tagline" value={settings.tagline} onChange={handleInputChange} className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 block mb-1">Website Slug</label>
          <input type="text" name="slug" value={settings.slug} onChange={handleInputChange} placeholder="my-cool-business" className="w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
          <p className="text-xs text-slate-500 mt-1">Used for the shareable URL. Lowercase letters, numbers, and dashes only.</p>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 block mb-1">Hero Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettingsForm;