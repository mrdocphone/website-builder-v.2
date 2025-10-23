// Vercel Serverless Function
// This function retrieves website data from Vercel KV by its slug.
import { kv } from '@vercel/kv';
import type { WebsiteData } from '../types';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { 
      status: 405, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
        return new Response(JSON.stringify({ message: 'Slug is required.' }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    // Vercel KV automatically parses JSON, so kv.get() returns an object.
    const websiteData = await kv.get<WebsiteData>(slug);

    if (websiteData) {
        // We must re-stringify the object to send it as a valid JSON response.
        return new Response(JSON.stringify(websiteData), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });
    } else {
        return new Response(JSON.stringify({ message: 'Site not found.' }), { 
            status: 404, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
  } catch (error) {
    console.error('Error in /api/site:', error);
    return new Response(JSON.stringify({ message: 'Failed to retrieve site data.' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}