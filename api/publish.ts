
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

        // If the slug is 'home' or the first page, also save it to the root path for the user
        if (websiteData.slug === 'home') {
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
