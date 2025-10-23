// Vercel Serverless Function
// This function securely handles the login request on the server-side.
import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

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
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const { username, password, type } = await request.json();

    // --- Admin Login ---
    if (type === 'admin') {
        const adminUser = process.env.ADMIN_USERNAME || 'admin';
        const adminPass = process.env.ADMIN_PASSWORD || 'password';
        if (username === adminUser && password === adminPass) {
          return new Response(JSON.stringify({ success: true, type: 'admin', username: 'admin' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
    }
    
    // --- User Login ---
    if (type === 'user') {
        const userData = await kv.get<{ hashedPassword?: string }>(`user:${username}`);
        if (userData && userData.hashedPassword) {
            const inputPasswordHash = await hashPassword(password);
            if (inputPasswordHash === userData.hashedPassword) {
                return new Response(JSON.stringify({ success: true, type: 'user', username }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
        }
    }

    // If neither login type succeeds
    return new Response(JSON.stringify({ success: false, message: 'Invalid username or password.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ success: false, message: 'An internal error occurred.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
}