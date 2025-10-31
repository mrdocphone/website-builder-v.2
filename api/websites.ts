



// Vercel Serverless Function
import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';
import type { WebsiteData, Session, ResponsiveStyles, Page } from '../types';

export const config = {
  runtime: 'edge',
};

const emptyStyles: ResponsiveStyles = {
    desktop: {}, tablet: {}, mobile: {}
};

const createDefaultWebsite = (id: string, name: string): WebsiteData => {
  const homePageId = uuidv4();
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
        id: uuidv4(),
        type: 'section',
        styles: {
          desktop: { paddingTop: '2rem', paddingBottom: '2rem' },
          tablet: {},
          mobile: {},
        },
        children: [{
          id: uuidv4(),
          type: 'row',
          styles: emptyStyles,
          children: [{
            id: uuidv4(),
            type: 'column',
            styles: emptyStyles,
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
    id,
    name,
    theme: 'light',
    faviconUrl: '/favicon.ico',
    header: [],
    footer: [],
    palette: {
        primary: '#4f46e5',
        secondary: '#f1f5f9',
        text: '#334155',
        accent: '#0ea5e9',
    },
    assets: [],
    globalStyles: {
        colors: [],
        typography: [],
    },
    pages: [homePage]
  };
};


async function handleGet(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
        return new Response(JSON.stringify({ message: 'Username is required' }), { status: 400 });
    }

    const websiteIds = await kv.smembers<string[]>(`user:${username}:websites`);
    if (!websiteIds || websiteIds.length === 0) {
        return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const pipeline = kv.pipeline();
    websiteIds.forEach(id => pipeline.get(`editor:${id}`));
    const websitesData = await pipeline.exec<WebsiteData[]>();

    const validWebsites = websitesData.filter(Boolean); // Filter out any null responses for deleted sites

    return new Response(JSON.stringify(validWebsites), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

async function handlePost(request: Request) {
    const { name, username } = await request.json();
    if (!name || !username) {
        return new Response(JSON.stringify({ message: 'Website name and username are required' }), { status: 400 });
    }

    const websiteId = uuidv4();
    const newWebsiteData = createDefaultWebsite(websiteId, name);

    const pipeline = kv.pipeline();
    pipeline.set(`editor:${websiteId}`, JSON.stringify(newWebsiteData));
    pipeline.sadd(`user:${username}:websites`, websiteId);
    await pipeline.exec();

    return new Response(JSON.stringify(newWebsiteData), { status: 201, headers: { 'Content-Type': 'application/json' } });
}

async function handleDelete(request: Request) {
    const { websiteId, username } = await request.json();
    if (!websiteId || !username) {
        return new Response(JSON.stringify({ message: 'Website ID and username are required' }), { status: 400 });
    }
    
    // Security check: ensure the user owns this website
    const isMember = await kv.sismember(`user:${username}:websites`, websiteId);
    if (!isMember) {
        return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
    }

    const pipeline = kv.pipeline();
    pipeline.del(`editor:${websiteId}`);
    pipeline.srem(`user:${username}:websites`, websiteId);
    await pipeline.exec();

    // Note: This does not delete the published version of the site, only the editor data.
    // The main `delete-user` function will catch-all delete published sites.

    return new Response(JSON.stringify({ success: true }), { status: 200 });
}


export default async function handler(request: Request) {
    // A real app would have robust authentication here to verify the user session.
    // For this prototype, we trust the username sent from the client.
    try {
        if (request.method === 'GET') {
            return await handleGet(request);
        }
        if (request.method === 'POST') {
            return await handlePost(request);
        }
        if (request.method === 'DELETE') {
            return await handleDelete(request);
        }
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
    } catch (error) {
        console.error('API Error in /api/websites:', error);
        return new Response(JSON.stringify({ message: 'An internal server error occurred.' }), { status: 500 });
    }
}