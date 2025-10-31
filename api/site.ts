// Vercel Serverless Function
// This function retrieves website data from Vercel KV by its slug.
import { kv } from '@vercel/kv';
import type { Page, WebsiteData } from '../types';

export const config = {
  runtime: 'edge',
};

// Define the type for our new pointer structure
interface SitePointer {
    websiteId: string;
    pageId: string;
}

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
    
    // Step 1: Fetch the pointer from the live site key
    const pointer = await kv.get<SitePointer>(key);

    if (!pointer || !pointer.websiteId || !pointer.pageId) {
        return new Response(JSON.stringify({ message: 'Site not found.' }), { 
            status: 404, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    // Step 2: Fetch the full website data using the pointer's websiteId
    const websiteData = await kv.get<WebsiteData>(`editor:${pointer.websiteId}`);

    if (!websiteData) {
        // This case indicates data inconsistency, but we'll treat it as a 404.
        return new Response(JSON.stringify({ message: 'Site data could not be loaded.' }), { 
            status: 404, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }

    // Step 3: Find the specific page within the full website data
    const pageData = websiteData.pages.find(p => p.id === pointer.pageId);

    if (!pageData) {
         return new Response(JSON.stringify({ message: 'Page not found within the site.' }), { 
            status: 404, 
            headers: { 'Content-Type': 'application/json' } 
        });
    }
        
    // NEW: Check for password protection
    if (pageData.password) {
        const providedPassword = request.headers.get('x-password');
        if (providedPassword !== pageData.password) {
            return new Response(JSON.stringify({ passwordRequired: true }), { 
                status: 200, // Send 200 so frontend can handle it
                headers: { 'Content-Type': 'application/json' } 
            });
        }
    }
    
    // Step 4: Construct the final response object in the format the frontend expects
    const finalResponse = {
        site: websiteData,
        page: pageData,
    };

    return new Response(JSON.stringify(finalResponse), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Error in /api/site:', error);
    return new Response(JSON.stringify({ message: 'Failed to retrieve site data.' }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}