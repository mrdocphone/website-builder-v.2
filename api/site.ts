// Vercel Serverless Function
// This function retrieves website data from Vercel KV by its slug.
import { kv } from '@vercel/kv';

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
    const slugParam = searchParams.get('slug');

    if (!slugParam) {
        return new Response(JSON.stringify({ message: 'Slug is required.' }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    const key = `site:${slugParam.replace('/', ':')}`;
    const rawData = await kv.get(key);
    
    let websiteData = null;

    if (typeof rawData === 'string') {
        try {
            websiteData = JSON.parse(rawData);
        } catch (e) {
            console.error(`Failed to parse JSON for key ${key}:`, rawData);
            // Treat unparseable strings as if the data wasn't found.
            websiteData = null; 
        }
    } else if (typeof rawData === 'object' && rawData !== null) {
        // Data might already be a parsed object.
        websiteData = rawData;
    }

    if (websiteData) {
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