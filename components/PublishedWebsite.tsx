

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { WebsiteData, Page, WebsiteNode } from '../types';
import Preview from './Preview';


// Helper to recursively find all nodes with hover styles
const findHoverStyles = (nodes: WebsiteNode[]): { id: string; styles: any }[] => {
    let styles: { id: string; styles: any }[] = [];
    for (const node of nodes) {
        if (node.hoverStyles) {
            styles.push({ id: node.id, styles: node.hoverStyles });
        }
        if ('children' in node && Array.isArray(node.children)) {
            styles = styles.concat(findHoverStyles(node.children as WebsiteNode[]));
        }
    }
    return styles;
};

const PublishedWebsite: React.FC = () => {
  const { username, slug } = useParams<{ username: string; slug?: string }>();
  // The API now returns the full WebsiteData object which includes the specific page data.
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [pageData, setPageData] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWebsiteData = async () => {
        if (!username) {
            setError("Username not found in URL.");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        
        const queryParams = new URLSearchParams({ username });
        if (slug) {
            queryParams.append('slug', slug);
        }

        try {
            const response = await fetch(`/api/site?${queryParams.toString()}`);

            if (response.status === 404) {
                throw new Error("We couldn't find a website at this address. Please check the URL.");
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "An error occurred while loading the website.");
            }

            const parsedData = await response.json();
            setWebsiteData(parsedData.site);
            setPageData(parsedData.page);
            

        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
            console.error("Failed to load website data", e);
        } finally {
            setIsLoading(false);
        }
    };
    
    fetchWebsiteData();

  }, [username, slug]);
  
  useEffect(() => {
    if (websiteData && pageData) {
        document.title = pageData.metaTitle || websiteData.name;
        document.body.style.fontFamily = websiteData.googleFont ? `'${websiteData.googleFont}', sans-serif` : 'sans-serif';

        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', pageData.metaDescription || pageData.tagline || '');

        let favicon = document.querySelector('link[rel="icon"]');
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.setAttribute('rel', 'icon');
            document.head.appendChild(favicon);
        }
        favicon.setAttribute('href', websiteData.faviconUrl || '/favicon.ico');
        
        // Google Font
        if (websiteData.googleFont) {
            const fontLink = document.getElementById('google-font-link') as HTMLLinkElement;
            if (fontLink) {
                 fontLink.href = `https://fonts.googleapis.com/css2?family=${websiteData.googleFont.replace(/ /g, '+')}:wght@400;700&display=swap`;
            }
        }
    }
  }, [websiteData, pageData]);
  
   const dynamicStyles = useMemo(() => {
    if (!websiteData) return '';
    const hoverNodes = [
      ...findHoverStyles(websiteData.header),
      ...(pageData ? findHoverStyles(pageData.children) : []),
      ...findHoverStyles(websiteData.footer),
    ];

    const desktopStyles = hoverNodes.map(({ id, styles }) => `[data-node-id="${id}"]:hover { ${Object.entries(styles.desktop).map(([k, v]) => `${k.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}: ${v};`).join(' ')} }`).join('\n');
    const tabletStyles = hoverNodes.map(({ id, styles }) => `[data-node-id="${id}"]:hover { ${Object.entries(styles.tablet).map(([k, v]) => `${k.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}: ${v};`).join(' ')} }`).join('\n');
    const mobileStyles = hoverNodes.map(({ id, styles }) => `[data-node-id="${id}"]:hover { ${Object.entries(styles.mobile).map(([k, v]) => `${k.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}: ${v};`).join(' ')} }`).join('\n');

    return `
      ${desktopStyles}
      @media (max-width: 768px) { ${tabletStyles} }
      @media (max-width: 375px) { ${mobileStyles} }
    `;
  }, [websiteData, pageData]);
  
  useEffect(() => {
    const styleEl = document.getElementById('dynamic-styles');
    if (styleEl) {
      styleEl.innerHTML = dynamicStyles;
    }
  }, [dynamicStyles]);


  // Animation effect for published site
  useEffect(() => {
    if (!isLoading && websiteData) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      const animatedElements = document.querySelectorAll('[data-animation]');
      animatedElements.forEach(el => observer.observe(el));

      return () => observer.disconnect();
    }
  }, [isLoading, websiteData]);


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

  if (!websiteData || !pageData) {
    return null;
  }

  return (
    <div className="w-screen h-screen" style={{ cursor: websiteData.customCursor || 'default' }}>
      <Preview websiteData={websiteData} activePage={pageData} />
    </div>
  );
};

export default PublishedWebsite;