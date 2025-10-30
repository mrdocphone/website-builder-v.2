import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { WebsiteData } from '../types';
import Preview from './Preview';


const PublishedWebsite: React.FC = () => {
  const { username, slug } = useParams<{ username: string; slug?: string }>();
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const slugToFetch = slug ? `${username}/${slug}` : username;

    const fetchWebsiteData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/site?slug=${slugToFetch}`);

            if (response.status === 404) {
                throw new Error("We couldn't find a website at this address. Please check the URL.");
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "An error occurred while loading the website.");
            }

            const parsedData = await response.json();
            
            // Removed the complex backwards compatibility logic to improve stability.
            // Published sites will now only render using the modern, stable data format.
            if (parsedData.businessName && Array.isArray(parsedData.children)) {
                setWebsiteData(parsedData);
                document.title = parsedData.businessName;
            } else {
                throw new Error("The website data appears to be corrupted or in an old format.");
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
            console.error("Failed to load website data", e);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchWebsiteData();

  }, [username, slug]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-slate-100 font-sans">
        <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-700 text-lg">Loading website...</p>
        </div>
      </div>
    );
  }

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
    return null;
  }

  return (
    <div className="w-screen h-screen">
      <Preview websiteData={websiteData} />
    </div>
  );
};

export default PublishedWebsite;