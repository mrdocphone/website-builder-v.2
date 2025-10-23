import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

// This endpoint should be protected and only accessible by admins.
// The current app structure relies on client-side routing to hide the link.
export default async function handler(request: Request) {
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
    }

    try {
        const usernames = await kv.smembers('users');
        if (!usernames || usernames.length === 0) {
            return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const pipeline = kv.pipeline();
        usernames.forEach(username => {
            pipeline.get(`user:${username}`);
        });

        const usersData = await pipeline.exec();
        
        const users = usersData
            .filter(user => user !== null) // Filter out potential nulls if a user was deleted but not from the set
            .map((user: any) => {
                // IMPORTANT: Exclude the password hash from the response
                const { hashedPassword, ...safeUser } = user;
                return safeUser;
            });
            
        return new Response(JSON.stringify(users), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        return new Response(JSON.stringify({ message: 'Failed to fetch users.' }), { status: 500 });
    }
}