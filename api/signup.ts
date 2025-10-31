import { kv } from '@vercel/kv';
import { v4 as uuidv4 } from 'uuid';
import type { WebsiteData, Section } from '../types';

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

const createDefaultWebsite = (id: string, name: string): WebsiteData => ({
  id,
  name,
  slug: 'home',
  tagline: 'Your amazing tagline here!',
  theme: 'light',
  heroImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop',
  children: [
    {
      id: uuidv4(),
      type: 'section',
      styles: { paddingTop: '2rem', paddingBottom: '2rem' },
      children: [{
        id: uuidv4(),
        type: 'row',
        styles: {},
        children: [{
          id: uuidv4(),
          type: 'column',
          styles: {},
          children: [
            { id: uuidv4(), type: 'headline', styles: { textAlign: 'center' }, content: { level: 'h2', text: 'Welcome to Your New Website' } },
            { id: uuidv4(), type: 'text', styles: {}, content: { text: 'This is your first section. You can edit this text, change the layout, and add more content using the editor.' } }
          ]
        }]
      }]
    }
  ]
});

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

    // Create a default website for the new user
    const firstWebsiteId = uuidv4();
    const firstWebsiteData = createDefaultWebsite(firstWebsiteId, 'My First Website');

    const pipeline = kv.pipeline();
    // Store user data
    pipeline.set(`user:${username}`, JSON.stringify(newUser));
    // Add user to the master user set
    pipeline.sadd('users', username);
    // Store the new website's editor data
    pipeline.set(`editor:${firstWebsiteId}`, JSON.stringify(firstWebsiteData));
    // Add the new website's ID to the user's list of websites
    pipeline.sadd(`user:${username}:websites`, firstWebsiteId);

    await pipeline.exec();

    return new Response(JSON.stringify({ success: true, username: newUser.username }), { status: 201 });

  } catch (error) {
    console.error('Error in /api/signup:', error);
    return new Response(JSON.stringify({ message: 'Failed to create account.' }), { status: 500 });
  }
}