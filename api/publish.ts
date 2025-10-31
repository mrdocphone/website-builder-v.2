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

        if (!username || !websiteData || !websiteData.slug || !websiteData.id) {
            return new Response(JSON.stringify({ message: 'Username and complete website data (including ID and slug) are required.' }), { status: 400 });
        }
        
        // Sanitize on the server-side to guarantee key format consistency.
        const safeUsername = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
        const newSafeSlug = websiteData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');

        if (!newSafeSlug) {
            return new Response(JSON.stringify({ message: 'The URL path (slug) cannot be empty.' }), { status: 400 });
        }
        
        const newKey = `site:${safeUsername}/${newSafeSlug}`;
        
        // 1. Uniqueness check: See if another website is already published at the new slug.
        const existingDataAtNewKey = await kv.get<WebsiteData>(newKey);
        if (existingDataAtNewKey && existingDataAtNewKey.id !== websiteData.id) {
             return new Response(JSON.stringify({ message: `The URL path "/${newSafeSlug}" is already in use by another page. Please choose a unique one.` }), { status: 409 });
        }

        const editorDataKey = `editor:${websiteData.id}`;
        const currentEditorData = await kv.get<WebsiteData>(editorDataKey);
        const pipeline = kv.pipeline();

        // 2. Handle slug change: If slug has changed, delete the old published page.
        if (currentEditorData && currentEditorData.slug && currentEditorData.slug !== newSafeSlug) {
            const oldSafeSlug = currentEditorData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
            pipeline.del(`site:${safeUsername}/${oldSafeSlug}`);
        }
        
        const dataToSave = { ...websiteData, slug: newSafeSlug };

        // 3. Save the new/updated published page and also update the editor's data to persist the new slug.
        pipeline.set(newKey, JSON.stringify(dataToSave));
        pipeline.set(editorDataKey, JSON.stringify(dataToSave));

        // 4. Handle main page logic.
        const mainKey = `site:${safeUsername}`;
        const currentMainPage = await kv.get<WebsiteData>(mainKey);
        
        // This page becomes the main page if:
        // - Its slug is 'home'
        // - There is no main page currently
        // - The page being modified *was* the main page (to ensure the user doesn't lose their main page after a rename)
        if (newSafeSlug === 'home' || !currentMainPage || currentMainPage.id === websiteData.id) {
            pipeline.set(mainKey, JSON.stringify(dataToSave));
        }

        await pipeline.exec();

        return new Response(JSON.stringify({ success: true, url: `/${safeUsername}/${newSafeSlug}` }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Publishing error:', error);
        return new Response(JSON.stringify({ success: false, message: 'An internal error occurred during publishing.' }), { status: 500 });
    }
}
