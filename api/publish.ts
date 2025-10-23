// Vercel Serverless Function
// This function securely saves the website data to Vercel KV storage.
import { kv } from '@vercel/kv';
import type { WebsiteData } from '../types';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { 
      status: 405, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const { websiteData, username } = (await request.json()) as { websiteData: WebsiteData, username: string };

    if (!username) {
        return new Response(JSON.stringify({ message: 'User not identified.' }), { status: 401 });
    }
    if (!websiteData || !websiteData.slug || !websiteData.businessName) {
      return new Response(JSON.stringify({ message: 'Invalid data provided.' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const key = `site:${username}:${websiteData.slug}`;
    await kv.set(key, JSON.stringify(websiteData));

    return new Response(JSON.stringify({ success: true, slug: websiteData.slug }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in /api/publish:', error);
    return new Response(JSON.stringify({ message: 'Failed to publish website.' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}