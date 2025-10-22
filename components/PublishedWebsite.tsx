import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { WebsiteData } from '../types';
import Preview from './Preview';

const PublishedWebsite: React.FC = () => {
  const { data } = useParams<{ data: string }>();
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      try {
        const decodedString = decodeURIComponent(window.atob(data));
        const parsedData = JSON.parse(decodedString);
        
        // Updated validation for the new section-based data structure
        if (parsedData.businessName && Array.isArray(parsedData.sections) && parsedData.theme) {
          setWebsiteData(parsedData);
          document.title = parsedData.businessName;
        } else {
            throw new Error("Invalid data structure.");
        }
      } catch (e) {
        setError("Could not load website data. The link may be invalid or corrupted.");
        console.error("Failed to decode website data from URL", e);
      }
    } else {
      setError("No website data provided in the link.");
    }
  }, [data]);

  if (error) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-slate-100 font-sans p-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600">Loading Error</h1>
          <p className="mt-2 text-slate-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!websiteData) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-slate-100 font-sans">
        <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-700 text-lg">Loading website...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen">
      <Preview websiteData={websiteData} />
    </div>
  );
};

export default PublishedWebsite;