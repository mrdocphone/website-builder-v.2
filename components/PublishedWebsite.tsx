import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import type { WebsiteData, Element, Row, Column } from '../types';
import Preview from './Preview';
import { v4 as uuidv4 } from 'uuid';


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
            
            // Backwards compatibility check for old data structure
            if (parsedData.sections && !parsedData.children) {
              parsedData.children = parsedData.sections.map((s: any) => {
                  let titleElement: Element | null = null;
                  if (s.content?.title) {
                      titleElement = { id: uuidv4(), type: 'headline', styles: { textAlign: 'center', paddingBottom: '20px' }, content: { text: s.content.title, level: 'h2' }};
                  }
          
                  const sectionContentRow: Row = {
                      id: uuidv4(),
                      type: 'row' as const,
                      styles: {},
                      children: [] // This will be populated based on section type
                  };
          
                  switch(s.type) {
                      case 'about':
                      case 'testimonials': // treat testimonials as single column too
                          const elements: Element[] = [];
                          if (s.type === 'about' && s.content?.body) {
                              elements.push({ id: uuidv4(), type: 'text', styles: {}, content: { text: s.content.body }});
                          }
                          if (s.type === 'testimonials' && Array.isArray(s.content?.testimonials)) {
                              s.content.testimonials.forEach((testimonial: any) => {
                                  // Add guard to prevent crash on malformed testimonial data
                                  if (testimonial && typeof testimonial === 'object' && testimonial.quote && testimonial.author) {
                                      elements.push({ id: uuidv4(), type: 'text', styles: { fontStyle: 'italic', textAlign: 'center', paddingBottom: '5px' }, content: { text: `"${testimonial.quote}"` }});
                                      elements.push({ id: uuidv4(), type: 'text', styles: { textAlign: 'center', paddingBottom: '20px' }, content: { text: `- ${testimonial.author}` }});
                                  }
                              });
                          }
                          sectionContentRow.children = [{
                              id: uuidv4(),
                              type: 'column' as const,
                              styles: {},
                              children: elements
                          }];
                          break;
                      case 'services':
                          if (Array.isArray(s.content?.services)) {
                              // Add filter to prevent crash on malformed service data
                              sectionContentRow.children = s.content.services
                                .filter((service: any) => service && typeof service === 'object' && service.name && service.description)
                                .map((service: any): Column => ({
                                  id: uuidv4(),
                                  type: 'column' as const,
                                  styles: { paddingLeft: '10px', paddingRight: '10px'},
                                  children: [
                                      { id: uuidv4(), type: 'headline', styles: { textAlign: 'center', paddingTop: '10px' }, content: { text: service.name, level: 'h3' }},
                                      { id: uuidv4(), type: 'text', styles: { textAlign: 'center', paddingBottom: '20px' }, content: { text: service.description }}
                                  ]
                              }));
                          }
                          break;
                      case 'gallery':
                          if (Array.isArray(s.content?.images)) {
                              // Add filter to prevent crash on malformed image data
                              sectionContentRow.children = s.content.images
                                .filter((image: any) => image && typeof image === 'object' && image.url && image.alt)
                                .map((image: any): Column => ({
                                  id: uuidv4(),
                                  type: 'column' as const,
                                  styles: { paddingLeft: '10px', paddingRight: '10px' },
                                  children: [
                                      { id: uuidv4(), type: 'image', styles: { paddingTop: '10px', paddingBottom: '10px' }, content: { src: image.url, alt: image.alt }}
                                  ]
                              }));
                          }
                          break;
                  }
          
                  const sectionRows: Row[] = [];
                  if (titleElement) {
                      sectionRows.push({
                          id: uuidv4(),
                          type: 'row' as const,
                          styles: {},
                          children: [{
                              id: uuidv4(),
                              type: 'column' as const,
                              styles: {},
                              children: [titleElement]
                          }]
                      });
                  }
                  if (sectionContentRow.children.length > 0) {
                      sectionRows.push(sectionContentRow);
                  }
          
                  return {
                      id: s.id || uuidv4(),
                      type: 'section' as const,
                      styles: { paddingTop: '40px', paddingBottom: '40px' },
                      children: sectionRows
                  };
              });
              delete parsedData.sections;
            }


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
      <Preview websiteData={websiteData} isEditor={false} />
    </div>
  );
};

export default PublishedWebsite;