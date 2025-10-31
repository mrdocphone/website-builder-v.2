
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
    const usernameParam = searchParams.get('username');
    const slugParam = searchParams.get('slug'); // This will be null if not present

    if (!usernameParam) {
        return new Response(JSON.stringify({ message: 'Username is required.' }), { 
            status: 400, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    // Sanitize on the server-side to guarantee key format consistency, matching the publish API.
    const safeUsername = usernameParam.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const safeSlug = slugParam ? slugParam.toLowerCase().replace(/[^a-z0-9-]/g, '') : null;

    // If a slug is provided, fetch a specific sub-page (e.g., site-user-about).
    // If no slug is provided, fetch the user's main page (e.g., site-user).
    const key = safeSlug ? `site-${safeUsername}-${safeSlug}` : `site-${safeUsername}`;
    const rawData = await kv.get(key);
    
    let websiteData: any = null;

    if (typeof rawData === 'string') {
        try {
            websiteData = JSON.parse(rawData);
        } catch (e) {
            console.error(`Failed to parse JSON for key ${key}:`, rawData);
            websiteData = null; 
        }
    } else if (typeof rawData === 'object' && rawData !== null) {
        websiteData = rawData;
    }

    if (websiteData && typeof websiteData === 'object' && websiteData.businessName && Array.isArray(websiteData.children)) {
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