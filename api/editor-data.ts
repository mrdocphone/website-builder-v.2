// Vercel Serverless Function
// This function handles saving and retrieving the main editor state from Vercel KV.
import { kv } from '@vercel/kv';
import type { WebsiteData } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  runtime: 'edge',
};

const getEditorDataKey = (username: string) => `editor-data:${username}`;

const getDefaultData = (username: string): WebsiteData => {
  const isDefaultAdmin = username === 'admin';
  return {
    businessName: isDefaultAdmin ? 'Starlight Bakery' : 'My New Business',
    tagline: isDefaultAdmin ? 'Freshly baked goodness, every day.' : 'Your amazing tagline here!',
    slug: isDefaultAdmin ? 'starlight-bakery' : username,
    heroImageUrl: `https://picsum.photos/1200/600?random=${Math.floor(Math.random() * 10)}`,
    theme: 'light',
    sections: isDefaultAdmin ? [
      {
        id: uuidv4(),
        type: 'about',
        content: {
          title: 'About Us',
          body: 'Founded in 2023, Starlight Bakery has been a beloved part of the community, offering delicious, handcrafted breads, pastries, and cakes. Our passion for quality ingredients and traditional baking methods is baked into every item we create.'
        }
      },
      {
        id: uuidv4(),
        type: 'services',
        content: {
          title: 'Our Specialties',
          services: [
            { id: uuidv4(), name: 'Artisan Breads', description: 'Sourdough, rye, and whole wheat, baked fresh daily.' },
            { id: uuidv4(), name: 'Custom Cakes', description: 'Beautifully designed cakes for any occasion.' },
            { id: uuidv4(), name: 'Morning Pastries', description: 'Croissants, scones, and muffins to start your day right.' },
          ]
        }
      }
    ] : [
        {
            id: uuidv4(),
            type: 'about',
            content: { title: 'About Us', body: 'Tell your customers about your business.' }
        }
    ]
  };
};

export default async function handler(request: Request) {
    if (request.method === 'GET') {
        try {
            const { searchParams } = new URL(request.url);
            const username = searchParams.get('username');

            if (!username) {
                return new Response(JSON.stringify({ message: 'Username is required.' }), { status: 400 });
            }

            const key = getEditorDataKey(username);
            const data = await kv.get<WebsiteData>(key);
            const responseData = data || getDefaultData(username);
            
            return new Response(JSON.stringify(responseData), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Error fetching editor data:', error);
            return new Response(JSON.stringify({ message: 'Failed to retrieve editor data.' }), { status: 500 });
        }
    }

    if (request.method === 'POST') {
        try {
            const { websiteData, username } = await request.json();
            if (!username) {
                return new Response(JSON.stringify({ message: 'Username is required.' }), { status: 400 });
            }
            if (!websiteData || !websiteData.businessName || !websiteData.sections) {
                 return new Response(JSON.stringify({ message: 'Invalid data format.' }), { status: 400 });
            }
            
            const key = getEditorDataKey(username);
            await kv.set(key, JSON.stringify(websiteData));
            return new Response(JSON.stringify({ success: true }), { status: 200 });
        } catch (error) {
            console.error('Error saving editor data:', error);
            return new Response(JSON.stringify({ message: 'Failed to save editor data.' }), { status: 500 });
        }
    }

    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
}