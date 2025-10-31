import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

// This endpoint should be protected and only accessible by admins.
// In a real-world app, you'd verify an admin session token here.
export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
    }

    try {
        const { username } = await request.json();

        if (!username) {
            return new Response(JSON.stringify({ message: 'Username is required.' }), { status: 400 });
        }
        
        // Find all published site keys for the user (e.g., site:user and site:user/about)
        const userSiteKeys: string[] = [];
        let cursor = 0;
        do {
            const [nextCursor, keys] = await kv.scan(cursor, { match: `site:${username}*` });
            cursor = nextCursor;
            userSiteKeys.push(...keys);
        } while (cursor !== 0);

        // Find all of the user's website editor data IDs
        const websiteIds = await kv.smembers(`user:${username}:websites`);

        // Prepare deletion pipeline
        const pipeline = kv.pipeline();
        
        // 1. Delete user account record
        pipeline.del(`user:${username}`);
        
        // 2. Delete user's set of websites
        pipeline.del(`user:${username}:websites`);
        
        // 3. Remove user from the master user list
        pipeline.srem('users', username);

        // 4. Delete all of the user's published sites if any keys were found
        if (userSiteKeys.length > 0) {
           pipeline.del(...userSiteKeys);
        }

        // 5. Delete all of the user's saved editor data
        if (websiteIds.length > 0) {
            pipeline.del(...websiteIds.map(id => `editor:${id}`));
        }

        // Execute all deletions in a single transaction
        await pipeline.exec();

        return new Response(JSON.stringify({ success: true, message: `User ${username} and all their data have been deleted.` }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        return new Response(JSON.stringify({ message: 'Failed to delete user.' }), { status: 500 });
    }
}
