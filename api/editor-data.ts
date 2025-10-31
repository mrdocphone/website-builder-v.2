
// Vercel Serverless Function
import { kv } from '@vercel/kv';
import type { WebsiteData } from '../types';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method === 'GET') {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        if (!username) {
            return new Response(JSON.stringify({ message: 'Username is required.' }), { status: 400 });
        }
        const data = await kv.get<WebsiteData>(`editor:${username}`);
        if (data) {
            return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ message: 'No editor data found.' }), { status: 404 });

    } else if (request.method === 'POST') {
        const { username, websiteData } = (await request.json()) as { username: string, websiteData: WebsiteData };
        if (!username || !websiteData) {
            return new Response(JSON.stringify({ message: 'Username and website data are required.' }), { status: 400 });
        }
        await kv.set(`editor:${username}`, JSON.stringify(websiteData));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
        
    } else {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
    }
}