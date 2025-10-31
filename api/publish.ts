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
        const oldPublishedSlugs = new Set(oldWebsiteData?.pages.filter(p => !p.isDraft).map(p => p.slug) || []);
        
        const publishablePages = websiteData.pages.filter(p => !p.isDraft);
        const newPublishedSlugs = new Set(publishablePages.map(p => p.slug));
        
        // NEW: Update timestamp on publish
        websiteData.lastUpdatedAt = new Date().toISOString();

        const pipeline = kv.pipeline();

        // 1. Process all publishable pages
        for (const page of publishablePages) {
            const safeSlug = page.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
            if (!safeSlug) continue;

            const pageKey = `site:${safeUsername}/${safeSlug}`;
            pipeline.set(pageKey, JSON.stringify({ site: websiteData, page }));
        }
        
        // 2. Delete pages that were published before but are now drafted/deleted
        for (const oldSlug of oldPublishedSlugs) {
            if (typeof oldSlug !== 'string') continue;
            if (!newPublishedSlugs.has(oldSlug)) {
                const safeOldSlug = oldSlug.toLowerCase().replace(/[^a-z0-9-]/g, '');
                const keyToDelete = `site:${safeUsername}/${safeOldSlug}`;
                pipeline.del(keyToDelete);
            }
        }

        // 3. Set the main site entry point (homepage)
        // BUGFIX: Logic is updated to prevent site from going down if homepage is unpublished.
        let newHomepage = publishablePages.find(p => p.isHomepage);
        // If the designated homepage is drafted, or none is set, find the first available published page.
        if (!newHomepage && publishablePages.length > 0) {
            newHomepage = publishablePages[0];
        }

        if (newHomepage) {
            const mainKey = `site:${safeUsername}`;
            pipeline.set(mainKey, JSON.stringify({ site: websiteData, page: newHomepage }));
        } else {
             // Only delete the root entry if there are NO publishable pages left.
            pipeline.del(`site:${safeUsername}`);
        }
        
        // 4. Update the editor's source of truth
        pipeline.set(editorDataKey, JSON.stringify(websiteData));

        await pipeline.exec();

        const successUrl = newHomepage ? `/${safeUsername}/${newHomepage.slug}` : `/${safeUsername}`;

        return new Response(JSON.stringify({ success: true, url: successUrl }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Publishing error:', error);
        return new Response(JSON.stringify({ success: false, message: 'An internal error occurred during publishing.' }), { status: 500 });
    }
}