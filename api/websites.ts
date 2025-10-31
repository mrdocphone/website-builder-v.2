
// Vercel Serverless Function
import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';
import type { WebsiteData, Session, ResponsiveStyles, Page, WebsiteNode } from '../types';

export const config = {
  runtime: 'edge',
};

// Helper function to deep clone an entire website object and assign new UUIDs to every single node.
function deepCloneWebsite(website: WebsiteData): WebsiteData {
    const idMapping = new Map<string, string>();
    
    const generateId = (oldId: string) => {
        if (!idMapping.has(oldId)) {
            idMapping.set(oldId, uuidv4());
        }
        return idMapping.get(oldId)!;
    };

    const cloneNode = (node: any): any => {
        const newNode = { ...node, id: generateId(node.id) };
        
        // Handle nested content structures like Tabs and Accordions
        if (typeof newNode.content === 'object' && newNode.content !== null) {
            if (Array.isArray(newNode.content.items)) {
                 newNode.content.items = newNode.content.items.map((item: any) => {
                     const newItem = {...item, id: generateId(item.id)};
                     if (Array.isArray(newItem.content)) { // For Tabs
                         newItem.content = newItem.content.map(cloneNode);
                     }
                     return newItem;
                });
            }
        }

        if (Array.isArray(newNode.children)) {
            newNode.children = newNode.children.map(cloneNode);
        }

        return newNode;
    };

    const newWebsite = { ...website };
    newWebsite.id = generateId(website.id);
    newWebsite.name = `${website.name} (Copy)`;
    
    newWebsite.pages = website.pages.map(page => ({
        ...page,
        id: generateId(page.id),
        children: page.children.map(cloneNode)
    }));
    
    newWebsite.header = website.header.map(cloneNode);
    newWebsite.footer = website.footer.map(cloneNode);
    
    return newWebsite;
}


const createDefaultWebsite = (id: string, name: string): WebsiteData => {
  const homePageId = uuidv4();
  const emptyStyles: ResponsiveStyles = { desktop: {}, tablet: {}, mobile: {} };
  const homePage: Page = {
    id: homePageId,
    name: 'Home',
    slug: 'home',
    isHomepage: true,
    tagline: 'Your amazing tagline here!',
    heroImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop',
    metaTitle: name,
    metaDescription: 'A website created with Gen-Z Builder.',
    children: [
      {
        id: uuidv4(), type: 'section',
        styles: { desktop: { paddingTop: '2rem', paddingBottom: '2rem' }, tablet: {}, mobile: {} },
        children: [{
          id: uuidv4(), type: 'row', styles: emptyStyles,
          children: [{
            id: uuidv4(), type: 'column', styles: emptyStyles,
            children: [
              { id: uuidv4(), type: 'headline', styles: { ...emptyStyles, desktop: { textAlign: 'center' } }, content: { level: 'h2', text: 'Welcome to Your New Website' } },
              { id: uuidv4(), type: 'text', styles: emptyStyles, content: { text: 'This is your first section. You can edit this text, change the layout, and add more content using the editor.' } }
            ]
          }]
        }]
      }
    ]
  };

  return {
    id, name, theme: 'light', faviconUrl: '/favicon.ico', customHeadCode: '',
    header: [], footer: [],
    palette: { primary: '#4f46e5', secondary: '#f1f5f9', text: '#334155', accent: '#0ea5e9' },
    assets: [], globalStyles: { colors: [], typography: [] }, pages: [homePage],
    lastUpdatedAt: new Date().toISOString(), tags: [],
  };
};


async function handleGet(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) { return new Response(JSON.stringify({ message: 'Username is required' }), { status: 400 }); }

    const websiteIds = await kv.smembers<string[]>(`user:${username}:websites`);
    if (!websiteIds || websiteIds.length === 0) {
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const pipeline = kv.pipeline();
    websiteIds.forEach(id => pipeline.get(`editor:${id}`));
    const websitesData = await pipeline.exec<WebsiteData[]>();

    return new Response(JSON.stringify(websitesData.filter(Boolean)), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

async function handlePost(request: Request) {
    const { name, username, duplicateWebsiteId } = await request.json();
    if (!username) {
        return new Response(JSON.stringify({ message: 'Username is required' }), { status: 400 });
    }

    let newWebsiteData: WebsiteData;
    
    if (duplicateWebsiteId) {
        const isMember = await kv.sismember(`user:${username}:websites`, duplicateWebsiteId);
        if (!isMember) { return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 }); }
        
        const originalWebsite = await kv.get<WebsiteData>(`editor:${duplicateWebsiteId}`);
        if (!originalWebsite) { return new Response(JSON.stringify({ message: 'Website to duplicate not found' }), { status: 404 }); }
        
        newWebsiteData = deepCloneWebsite(originalWebsite);
    } else {
         if (!name) { return new Response(JSON.stringify({ message: 'Website name is required' }), { status: 400 }); }
         const websiteId = uuidv4();
         newWebsiteData = createDefaultWebsite(websiteId, name);
    }
    
    newWebsiteData.lastUpdatedAt = new Date().toISOString();

    const pipeline = kv.pipeline();
    pipeline.set(`editor:${newWebsiteData.id}`, JSON.stringify(newWebsiteData));
    pipeline.sadd(`user:${username}:websites`, newWebsiteData.id);
    await pipeline.exec();

    return new Response(JSON.stringify(newWebsiteData), { status: 201, headers: { 'Content-Type': 'application/json' } });
}

async function handlePut(request: Request) {
    const { websiteId, username, updates } = await request.json();
    if (!websiteId || !username || !updates) {
        return new Response(JSON.stringify({ message: 'Website ID, username, and updates are required' }), { status: 400 });
    }

    const isMember = await kv.sismember(`user:${username}:websites`, websiteId);
    if (!isMember) {
        return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
    }

    const existingData = await kv.get<WebsiteData>(`editor:${websiteId}`);
    if (!existingData) {
        return new Response(JSON.stringify({ message: 'Website not found' }), { status: 404 });
    }

    // Only allow specific fields to be updated
    const allowedUpdates: Partial<WebsiteData> = {};
    if (updates.name) allowedUpdates.name = updates.name;
    if (Array.isArray(updates.tags)) allowedUpdates.tags = updates.tags;

    const updatedData: WebsiteData = {
        ...existingData,
        ...allowedUpdates,
        lastUpdatedAt: new Date().toISOString(),
    };

    await kv.set(`editor:${websiteId}`, JSON.stringify(updatedData));
    return new Response(JSON.stringify(updatedData), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

async function handleDelete(request: Request) {
    const { websiteId, username } = await request.json();
    if (!websiteId || !username) {
        return new Response(JSON.stringify({ message: 'Website ID and username are required' }), { status: 400 });
    }
    
    const isMember = await kv.sismember(`user:${username}:websites`, websiteId);
    if (!isMember) {
        return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
    }

    const pipeline = kv.pipeline();
    const safeUsername = username.toLowerCase().replace(/[^a-z0-9-]/g, '');

    // BUGFIX: Clean up published pages associated with the deleted website.
    const websiteToDelete = await kv.get<WebsiteData>(`editor:${websiteId}`);
    if (websiteToDelete && websiteToDelete.pages) {
        // Check if this website contains the main homepage
        const mainSiteData = await kv.get<{ page: Page }>(`site:${safeUsername}`);
        const isHomepageInDeletedSite = mainSiteData && websiteToDelete.pages.some(p => p.id === mainSiteData.page.id);
        
        // Delete all published pages for this site
        for (const page of websiteToDelete.pages) {
            if (!page.isDraft && page.slug) {
                const safeSlug = page.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
                pipeline.del(`site:${safeUsername}/${safeSlug}`);
            }
        }
        
        // If the main homepage was part of the deleted site, remove it.
        if (isHomepageInDeletedSite) {
            pipeline.del(`site:${safeUsername}`);
        }
    }

    pipeline.del(`editor:${websiteId}`);
    pipeline.srem(`user:${username}:websites`, websiteId);
    await pipeline.exec();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
}


export default async function handler(request: Request) {
    try {
        if (request.method === 'GET') return await handleGet(request);
        if (request.method === 'POST') return await handlePost(request);
        if (request.method === 'PUT') return await handlePut(request);
        if (request.method === 'DELETE') return await handleDelete(request);
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
    } catch (error) {
        console.error('API Error in /api/websites:', error);
        return new Response(JSON.stringify({ message: 'An internal server error occurred.' }), { status: 500 });
    }
}