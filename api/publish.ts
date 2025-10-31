
// Vercel Serverless Function
import { kv } from '@vercel/kv';
import type { WebsiteData } from '../types';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
    }

    try {
        const { username, websiteData } = (await request.json()) as { username: string, websiteData: WebsiteData };

        if (!username || !websiteData || !websiteData.slug) {
            return new Response(JSON.stringify({ message: 'Username and website data with a slug are required.' }), { status: 400 });
        }
        
        // Sanitize on the server-side to guarantee key format consistency.
        const safeUsername = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const safeSlug = websiteData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

        if (!safeSlug) {
            return new Response(JSON.stringify({ message: 'The URL path (slug) cannot be empty.' }), { status: 400 });
        }

        const key = `site:${safeUsername}/${safeSlug}`;
        const mainKey = `site:${safeUsername}`;
        
        // Ensure the data being saved contains the sanitized slug
        const dataToSave = { ...websiteData, slug: safeSlug };

        // Save the specific page
        await kv.set(key, JSON.stringify(dataToSave));

        // Check if a main page already exists for this user.
        const mainPageExists = await kv.exists(mainKey);

        // If the current page's slug is 'home', it always becomes the main page.
        // If no main page exists yet, this publication becomes the main page by default.
        if (safeSlug === 'home' || !mainPageExists) {
            await kv.set(mainKey, JSON.stringify(dataToSave));
        }

        return new Response(JSON.stringify({ success: true, url: `/${safeUsername}/${safeSlug}` }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Publishing error:', error);
        return new Response(JSON.stringify({ success: false, message: 'An internal error occurred during publishing.' }), { status: 500 });
    }
}