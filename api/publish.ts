
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

        const key = `site:${username}:${websiteData.slug}`;
        const mainKey = `site:${username}`;

        // Save the specific page
        await kv.set(key, JSON.stringify(websiteData));

        // Check if a main page already exists for this user.
        // We use kv.exists which is more efficient than kv.get for this check.
        const mainPageExists = await kv.exists(mainKey);

        // If the current page's slug is 'home', it always becomes the main page.
        // If no main page exists yet, this publication becomes the main page by default.
        if (websiteData.slug === 'home' || !mainPageExists) {
            await kv.set(mainKey, JSON.stringify(websiteData));
        }

        return new Response(JSON.stringify({ success: true, url: `/${username}/${websiteData.slug}` }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Publishing error:', error);
        return new Response(JSON.stringify({ success: false, message: 'An internal error occurred during publishing.' }), { status: 500 });
    }
}
