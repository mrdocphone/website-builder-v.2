import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

// Helper function to hash password using Web Crypto API (available in edge runtime)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { name, username, password } = await request.json();

    if (!name || !username || !password) {
      return new Response(JSON.stringify({ message: 'Name, username, and password are required.' }), { status: 400 });
    }
    
    // Validate username format (similar to slug)
    const validUsername = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (validUsername !== username) {
        return new Response(JSON.stringify({ message: 'Username can only contain lowercase letters, numbers, and dashes.' }), { status: 400 });
    }

    const userExists = await kv.exists(`user:${username}`);
    if (userExists) {
      return new Response(JSON.stringify({ message: 'Username is already taken.' }), { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const newUser = { 
        name, 
        username, 
        hashedPassword,
        createdAt: new Date().toISOString() // Add timestamp
    };

    // Store user data and add username to the master user set
    await Promise.all([
        kv.set(`user:${username}`, JSON.stringify(newUser)),
        kv.sadd('users', username)
    ]);

    return new Response(JSON.stringify({ success: true, username: newUser.username }), { status: 201 });

  } catch (error) {
    console.error('Error in /api/signup:', error);
    return new Response(JSON.stringify({ message: 'Failed to create account.' }), { status: 500 });
  }
}