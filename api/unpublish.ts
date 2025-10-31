// Vercel Serverless Function
import { kv } from '@vercel/kv';
import type { WebsiteData, Page } from '../types';

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
    }

    try {
        const { websiteId, username } = await request.json();

        if (!websiteId || !username) {
            return new Response(JSON.stringify({ message: 'Website ID and username are required.' }), { status: 400 });
        }

        const isMember = await kv.sismember(`user:${username}:websites`, websiteId);
        if (!isMember) {
            return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
        }
        
        const website = await kv.get<WebsiteData>(`editor:${websiteId}`);

        if (!website) {
            return new Response(JSON.stringify({ message: 'Website not found.' }), { status: 404 });
        }
        
        // Set all pages to draft status
        website.pages.forEach(p => { p.isDraft = true; });
        website.lastUpdatedAt = new Date().toISOString();

        const pipeline = kv.pipeline();

        // 1. Update the editor's source of truth with the drafted pages
        pipeline.set(`editor:${websiteId}`, JSON.stringify(website));

        // 2. Delete all published site keys associated with this website
        const safeUsername = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const keysToDelete: string[] = [];
        
        // Add all page slugs to the deletion list
        for (const page of website.pages) {
            if (page.slug) {
                const safeSlug = page.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
                keysToDelete.push(`site:${safeUsername}/${safeSlug}`);
            }
        }
        
        // Also ensure the root domain entry is deleted
        keysToDelete.push(`site:${safeUsername}`);

        if (keysToDelete.length > 0) {
            // Use a Set to ensure we only call `del` with unique keys
            pipeline.del(...Array.from(new Set(keysToDelete)));
        }

        await pipeline.exec();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Unpublish error:', error);
        return new Response(JSON.stringify({ success: false, message: 'An internal error occurred during unpublishing.' }), { status: 500 });
    }
}
