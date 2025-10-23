// Vercel Serverless Function
// This function handles saving and retrieving the main editor state from Vercel KV.
import { kv } from '@vercel/kv';
import type { WebsiteData } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  runtime: 'edge',
};

// Use a consistent key to store the single admin user's editor data.
const EDITOR_DATA_KEY = 'editor-data:admin';

const getDefaultData = (): WebsiteData => {
  return {
    businessName: 'Starlight Bakery',
    tagline: 'Freshly baked goodness, every day.',
    slug: 'starlight-bakery',
    heroImageUrl: 'https://picsum.photos/1200/600?random=1',
    theme: 'light',
    sections: [
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
      },
      {
        id: uuidv4(),
        type: 'contact',
        content: {
          title: 'Get In Touch',
          address: '123 Main Street, Anytown, USA 12345',
          phone: '(555) 123-4567',
          email: 'contact@starlightbakery.com',
        }
      }
    ]
  };
};

export default async function handler(request: Request) {
    if (request.method === 'GET') {
        try {
            const data = await kv.get<WebsiteData>(EDITOR_DATA_KEY);
            const responseData = data || getDefaultData();
            return new Response(JSON.stringify(responseData), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error('Error fetching editor data:', error);
            return new Response(JSON.stringify({ message: 'Failed to retrieve editor data.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }

    if (request.method === 'POST') {
        try {
            const websiteData = await request.json();
            if (!websiteData || !websiteData.businessName || !websiteData.sections) {
                 return new Response(JSON.stringify({ message: 'Invalid data format.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
            await kv.set(EDITOR_DATA_KEY, JSON.stringify(websiteData));
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } catch (error) {
            console.error('Error saving editor data:', error);
            return new Response(JSON.stringify({ message: 'Failed to save editor data.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }

    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
}