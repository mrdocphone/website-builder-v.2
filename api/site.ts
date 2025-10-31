


// Vercel Serverless Function
// This function retrieves website data from Vercel KV by its slug.
import { kv } from '@vercel/kv';
import type { Page, WebsiteData } from '../types';

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

    const safeUsername = usernameParam.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const safeSlug = slugParam ? slugParam.toLowerCase().replace(/[^a-z0-9-]/g, '') : null;

    const key = safeSlug ? `site:${safeUsername}/${safeSlug}` : `site:${safeUsername}`;
    const rawData = await kv.get<{ site: WebsiteData, page: Page }>(key);
    
    if (rawData && rawData.site && rawData.page) {
        // NEW: Check for password protection
        if (rawData.page.password) {
            const providedPassword = request.headers.get('x-password');
            if (providedPassword !== rawData.page.password) {
                return new Response(JSON.stringify({ passwordRequired: true }), { 
                    status: 200, // Send 200 so frontend can handle it
                    headers: { 'Content-Type': 'application/json' } 
                });
            }
        }

        return new Response(JSON.stringify(rawData), { 
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