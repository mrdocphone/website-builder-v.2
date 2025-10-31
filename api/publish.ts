
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

        if (!username || !websiteData || !websiteData.id || !websiteData.pages) {
            return new Response(JSON.stringify({ message: 'Username and complete website data (including ID and pages) are required.' }), { status: 400 });
        }
        
        const safeUsername = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const editorDataKey = `editor:${websiteData.id}`;
        
        // Get the state of the website before this publish event
        const oldWebsiteData = await kv.get<WebsiteData>(editorDataKey);
        const oldSlugs = new Set(oldWebsiteData?.pages.map(p => p.slug) || []);
        const newSlugs = new Set(websiteData.pages.map(p => p.slug));

        const pipeline = kv.pipeline();

        // 1. Process all pages in the new data
        let homepage = websiteData.pages.find(p => p.isHomepage);
        if (!homepage && websiteData.pages.length > 0) {
            // Fallback: if no page is set as homepage, set the first one.
            homepage = websiteData.pages[0];
            homepage.isHomepage = true;
        }

        for (const page of websiteData.pages) {
            const safeSlug = page.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
            if (!safeSlug) continue; // Skip pages with empty slugs

            const pageKey = `site:${safeUsername}/${safeSlug}`;
            
            // Uniqueness check: This is complex in a multi-page context. 
            // For now, we assume slugs are unique within a site, managed by the editor.
            // A more robust check would scan all keys, but that's slow.

            pipeline.set(pageKey, JSON.stringify({ site: websiteData, page }));
        }

        // 2. Set the main site entry point (homepage)
        if (homepage) {
            const mainKey = `site:${safeUsername}`;
            pipeline.set(mainKey, JSON.stringify({ site: websiteData, page: homepage }));
        }

        // 3. Delete pages that existed before but are no longer in the new data
        for (const oldSlug of oldSlugs) {
            // FIX: Add a type guard to ensure oldSlug is a string before using string methods.
            if (typeof oldSlug !== 'string') continue;
            if (!newSlugs.has(oldSlug)) {
                const safeOldSlug = oldSlug.toLowerCase().replace(/[^a-z0-9-]/g, '');
                const keyToDelete = `site:${safeUsername}/${safeOldSlug}`;
                pipeline.del(keyToDelete);
            }
        }
        
        // 4. Update the editor's source of truth
        pipeline.set(editorDataKey, JSON.stringify(websiteData));

        await pipeline.exec();

        const successUrl = homepage ? `/${safeUsername}/${homepage.slug}` : `/${safeUsername}`;

        return new Response(JSON.stringify({ success: true, url: successUrl }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Publishing error:', error);
        return new Response(JSON.stringify({ success: false, message: 'An internal error occurred during publishing.' }), { status: 500 });
    }
}