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
        
        const oldWebsiteData = await kv.get<WebsiteData>(editorDataKey);
        const oldPublishedSlugs = new Set(oldWebsiteData?.pages.filter(p => !p.isDraft).map(p => p.slug) || []);
        
        const publishablePages = websiteData.pages.filter(p => !p.isDraft);
        const newPublishedSlugs = new Set(publishablePages.map(p => p.slug));
        
        websiteData.lastUpdatedAt = new Date().toISOString();

        const pipeline = kv.pipeline();

        // 1. Save the single, authoritative copy of the website data
        pipeline.set(editorDataKey, JSON.stringify(websiteData));

        // 2. Process all publishable pages by creating lightweight pointers
        for (const page of publishablePages) {
            const safeSlug = page.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
            if (!safeSlug) continue;

            const pageKey = `site:${safeUsername}/${safeSlug}`;
            // Store a lightweight pointer instead of the full data
            const pointer = { websiteId: websiteData.id, pageId: page.id };
            pipeline.set(pageKey, JSON.stringify(pointer));
        }
        
        // 3. Delete pages that were published before but are now drafted/deleted
        for (const oldSlug of oldPublishedSlugs) {
            if (typeof oldSlug !== 'string') continue;
            if (!newPublishedSlugs.has(oldSlug)) {
                const safeOldSlug = oldSlug.toLowerCase().replace(/[^a-z0-9-]/g, '');
                const keyToDelete = `site:${safeUsername}/${safeOldSlug}`;
                pipeline.del(keyToDelete);
            }
        }

        // 4. Set the main site entry point (homepage) as a pointer
        let newHomepage = publishablePages.find(p => p.isHomepage);
        if (!newHomepage && publishablePages.length > 0) {
            newHomepage = publishablePages[0];
        }

        const mainKey = `site:${safeUsername}`;
        if (newHomepage) {
            const pointer = { websiteId: websiteData.id, pageId: newHomepage.id };
            pipeline.set(mainKey, JSON.stringify(pointer));
        } else {
            pipeline.del(mainKey);
        }
        
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
