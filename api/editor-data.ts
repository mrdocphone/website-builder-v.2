
// Vercel Serverless Function
import { kv } from '@vercel/kv';
import type { WebsiteData } from '../types';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method === 'GET') {
        const { searchParams } = new URL(request.url);
        const websiteId = searchParams.get('websiteId');
        if (!websiteId) {
            return new Response(JSON.stringify({ message: 'Website ID is required.' }), { status: 400 });
        }
        const data = await kv.get<WebsiteData>(`editor:${websiteId}`);
        if (data) {
            return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ message: 'No editor data found for this website.' }), { status: 404 });

    } else if (request.method === 'POST') {
        const { websiteId, websiteData } = (await request.json()) as { websiteId: string, websiteData: WebsiteData };
        if (!websiteId || !websiteData) {
            return new Response(JSON.stringify({ message: 'Website ID and website data are required.' }), { status: 400 });
        }
        await kv.set(`editor:${websiteId}`, JSON.stringify(websiteData));
        return new Response(JSON.stringify({ success: true }), { status: 200 });
        
    } else {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
    }
}