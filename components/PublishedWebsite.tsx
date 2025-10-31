
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

const PasswordPrompt: React.FC<{ onSubmit: (password: string) => void; hasError: boolean; }> = ({ onSubmit, hasError }) => {
    const [password, setPassword] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(password);
    };
    return (
        <div className="w-screen h-screen flex items-center justify-center bg-slate-100">
            <form onSubmit={handleSubmit} className="p-8 bg-white rounded-lg shadow-md w-full max-w-sm">
                <h2 className="text-lg font-semibold mb-4 text-center">Password Required</h2>
                {hasError && <p className="text-sm text-red-600 mb-3 text-center">Incorrect password. Please try again.</p>}
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                  placeholder="Enter page password"
                  autoFocus
                />
                <button type="submit" className="w-full bg-indigo-600 text-white p-2 rounded">Submit</button>
            </form>
        </div>
    );
};

const PublishedWebsite: React.FC = () => {
  const { username, slug } = useParams<{ username: string; slug?: string }>();
  // The API now returns the full WebsiteData object which includes the specific page data.
  const [websiteData, setWebsiteData] = useState<WebsiteData | null>(null);
  const [pageData, setPageData] = useState<Page | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const fetchWebsiteData = useCallback(async (password?: string) => {
      if (!username) {
          setError("Username not found in URL.");
          setIsLoading(false);
          return;
      }

      setIsLoading(true);
      setError(null);
      setPasswordRequired(false);
      
      const queryParams = new URLSearchParams({ username });
      if (slug) {
          queryParams.append('slug', slug);
      }
      
      const headers = new Headers();
      if (password) {
          headers.append('x-password', password);
      }

      try {
          const response = await fetch(`/api/site?${queryParams.toString()}`, { headers });

          if (response.status === 404) {
              throw new Error("We couldn't find a website at this address. Please check the URL.");
          }
          if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.message || "An error occurred while loading the website.");
          }

          const parsedData = await response.json();

          if (parsedData.passwordRequired) {
              setPasswordRequired(true);
              if (password) { // If a password was provided and it's still required, it was wrong.
                  setPasswordError(true);
              }
          } else {
              setWebsiteData(parsedData.site);
              setPageData(parsedData.page);
              setPasswordError(false);
          }

      } catch (e) {
          setError(e instanceof Error ? e.message : "An unknown error occurred.");
          console.error("Failed to load website data", e);
      } finally {
          setIsLoading(false);
      }
  }, [username, slug]);
  
  useEffect(() => {
    fetchWebsiteData();
  }, [fetchWebsiteData]);
  
  useEffect(() => {
    if (websiteData && pageData) {
        document.title = pageData.metaTitle || websiteData.name;
        document.body.style.fontFamily = websiteData.googleFont ? `'${websiteData.googleFont}', sans-serif` : 'sans-serif';

        const updateMeta = (name: string, content: string) => {
            let el = document.querySelector(`meta[name="${name}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute('name', name);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };
        const updateOg = (property: string, content: string) => {
            let el = document.querySelector(`meta[property="${property}"]`);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute('property', property);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        updateMeta('description', pageData.metaDescription || pageData.tagline || '');
        updateOg('og:title', pageData.metaTitle || websiteData.name);
        updateOg('og:description', pageData.metaDescription || pageData.tagline || '');
        if (pageData.ogImageUrl) {
            updateOg('og:image', pageData.ogImageUrl);
        }

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
        
        // Custom Head Code
        if (websiteData.customHeadCode || pageData.customHeadCode) {
            const code = (websiteData.customHeadCode || '') + (pageData.customHeadCode || '');
            const scriptEl = document.createElement('div');
            scriptEl.innerHTML = code;
            Array.from(scriptEl.children).forEach(child => document.head.appendChild(child.cloneNode(true)));
        }
         // Custom Body Code
        if (pageData.customBodyCode) {
            const bodyDiv = document.createElement('div');
            bodyDiv.innerHTML = pageData.customBodyCode;
            Array.from(bodyDiv.children).forEach(child => document.body.appendChild(child.cloneNode(true)));
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
  
  if (passwordRequired) {
      return <PasswordPrompt onSubmit={(password) => fetchWebsiteData(password)} hasError={passwordError} />;
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