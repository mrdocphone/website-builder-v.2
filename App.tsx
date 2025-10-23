import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Editor from './components/Editor';
import PublishedWebsite from './components/PublishedWebsite';
import Login from './components/Login';
import type { WebsiteData, Section } from './types';
import { v4 as uuidv4 } from 'uuid';


// Data Migration function for backward compatibility
const migrateToSectionBasedData = (oldData: any): WebsiteData => {
  const slugify = (text: string) => (text || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const businessName = oldData.businessName || 'My Business';
  const sections: Section[] = [
    {
      id: uuidv4(),
      type: 'about',
      content: {
        title: 'About Us',
        body: oldData.aboutUs || 'Default about us text.'
      }
    },
    {
      id: uuidv4(),
      type: 'contact',
      content: {
        title: 'Get In Touch',
        address: oldData.contact?.address || '123 Main St',
        phone: oldData.contact?.phone || '555-1234',
        email: oldData.contact?.email || 'contact@example.com'
      }
    }
  ];

  return {
    businessName: businessName,
    tagline: oldData.tagline || 'My amazing business tagline',
    slug: oldData.slug || slugify(businessName),
    heroImageUrl: oldData.heroImageUrl || 'https://picsum.photos/1200/600?random=1',
    theme: oldData.theme || 'light',
    sections: sections
  };
};

const initialData = (): WebsiteData => {
    try {
      const savedData = localStorage.getItem('websiteData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // If data is in the old format (doesn't have a 'sections' array), migrate it.
        if (!parsedData.sections) {
          console.log("Migrating old data format...");
          return migrateToSectionBasedData(parsedData);
        }
        // Basic validation for new format
        if (parsedData.businessName && Array.isArray(parsedData.sections)) {
           // Add slug if missing for backward compatibility
           if (!parsedData.slug) {
             parsedData.slug = (parsedData.businessName || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
           }
           // Ensure all list items have IDs for data saved before the ID-update
          parsedData.sections.forEach((section: Section) => {
            if (section.type === 'services' && section.content.services) {
              section.content.services.forEach(item => { if (!item.id) item.id = uuidv4() });
            } else if (section.type === 'gallery' && section.content.images) {
              section.content.images.forEach(item => { if (!item.id) item.id = uuidv4() });
            } else if (section.type === 'testimonials' && section.content.testimonials) {
              section.content.testimonials.forEach(item => { if (!item.id) item.id = uuidv4() });
            }
          });
          return parsedData;
        }
      }
    } catch (e) {
      console.error("Failed to parse website data from localStorage", e);
      localStorage.removeItem('websiteData');
    }

    // Default data in the new section-based format
    return {
      businessName: 'Starlight Bakery',
      tagline: 'Freshly baked goodness, every day.',
      slug: 'starlight-bakery',
      heroImageUrl: 'https://picsum.photos/1200/600?random=1',
      theme: 'light',
      sections: [
        {
          id: uuidv4(),
          type: 'about',
          content: {
            title: 'About Us',
            body: 'Founded in 2023, Starlight Bakery has been a beloved part of the community, offering delicious, handcrafted breads, pastries, and cakes. Our passion for quality ingredients and traditional baking methods is baked into every item we create.'
          }
        },
        {
          id: uuidv4(),
          type: 'services',
          content: {
            title: 'Our Specialties',
            services: [
              { id: uuidv4(), name: 'Artisan Breads', description: 'Sourdough, rye, and whole wheat, baked fresh daily.' },
              { id: uuidv4(), name: 'Custom Cakes', description: 'Beautifully designed cakes for any occasion.' },
              { id: uuidv4(), name: 'Morning Pastries', description: 'Croissants, scones, and muffins to start your day right.' },
            ]
          }
        },
        {
          id: uuidv4(),
          type: 'contact',
          content: {
            title: 'Get In Touch',
            address: '123 Main Street, Anytown, USA 12345',
            phone: '(555) 123-4567',
            email: 'contact@starlightbakery.com',
          }
        }
      ]
    };
  };


const AppContent: React.FC = () => {
    const navigate = useNavigate();
    
    // Check if we're in a development/preview environment like AI Studio
    const isDevelopment = window.location.hostname === 'localhost' || !window.location.hostname.includes('.');

    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        // Bypass authentication for local development/preview in AI Studio
        if (isDevelopment) {
            return true;
        }
        return sessionStorage.getItem('isAuthenticated') === 'true';
    });

    const [websiteData, setWebsiteData] = useState<WebsiteData>(initialData);

    useEffect(() => {
        const handler = setTimeout(() => {
        try {
            localStorage.setItem('websiteData', JSON.stringify(websiteData));
        } catch (e) {
            console.error("Failed to save website data to localStorage", e);
        }
        }, 500);

        return () => clearTimeout(handler);
    }, [websiteData]);

    const handleLoginSuccess = () => {
        sessionStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
        navigate('/editor');
    };

    const handleLogout = () => {
        sessionStorage.removeItem('isAuthenticated');
        setIsAuthenticated(false);
        navigate('/');
    };

    return (
        <Routes>
            <Route 
                path="/editor" 
                element={
                    isAuthenticated ? (
                        <Editor 
                            websiteData={websiteData} 
                            setWebsiteData={setWebsiteData}
                            onLogout={handleLogout}
                        />
                    ) : (
                        <Navigate to="/" replace />
                    )
                }
            />
            
            <Route 
                path="/" 
                element={
                    isAuthenticated ? (
                        <Navigate to="/editor" replace />
                    ) : (
                        <Login onLoginSuccess={handleLoginSuccess} />
                    )
                }
            />
            
            {/* IMPORTANT: This route must be last to act as a catch-all for slugs */}
            <Route path="/:slug" element={<PublishedWebsite />} />
        </Routes>
    );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
