
import { GoogleGenAI, Type } from '@google/genai';
import type { WebsiteData, Section } from '../types';

export const config = {
  runtime: 'edge',
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// This schema tells the model exactly how to format its response.
const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, enum: ['headline', 'text', 'image', 'button'], description: 'The type of the element.' },
        content: { 
            type: Type.OBJECT,
            properties: {
                text: { type: Type.STRING, description: 'The text content for headline, text, or button.' },
                level: { type: Type.STRING, enum: ['h2', 'h3'], description: 'The heading level (h2 or h3) for headlines.' },
                src: { type: Type.STRING, description: 'The URL for an image. Should be a realistic, high-quality stock photo from a site like Unsplash.' },
                alt: { type: Type.STRING, description: 'A descriptive alt text for the image.' },
                href: { type: Type.STRING, description: 'The URL for a button link.' },
            },
            description: 'The content of the element.'
        }
      },
      required: ['type', 'content']
    }
};


export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
    }

    try {
        const { businessName, tagline, section } = (await request.json()) as {
            businessName: string;
            tagline: string;
            section: Section;
        };
        
        const columns = section.children.flatMap(row => row.children);
        const columnCount = columns.length;

        const prompt = `
            You are an expert web designer and copywriter. Your task is to generate the content for a single section of a website.
            
            **Business Information:**
            - Business Name: "${businessName}"
            - Tagline: "${tagline}"

            **Instructions:**
            - Generate content for a section that has ${columnCount} columns.
            - The content should be professional, engaging, and relevant to the business.
            - For images, provide a URL for a high-quality, relevant stock photo from Unsplash.
            - Ensure the response is a clean JSON array of elements, matching the provided schema.
            - Create content for exactly one headline and one text paragraph per column. You can optionally add an image or a button if it makes sense. Do not exceed 3 elements per column.
            - The response should be a JSON array only, with no surrounding text or markdown.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
            },
        });
        
        const jsonResponse = JSON.parse(response.text);

        // FIX: Distribute elements correctly across all columns, even in multi-row sections.
        const elementsByColumn: any[][] = columns.map(() => []);
        let currentColumnIndex = 0;
        jsonResponse.forEach((element: any) => {
            if (elementsByColumn[currentColumnIndex]) {
                elementsByColumn[currentColumnIndex].push(element);
            }
            currentColumnIndex = (currentColumnIndex + 1) % columnCount;
        });

        return new Response(JSON.stringify(elementsByColumn), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in /api/generate:', error);
        return new Response(JSON.stringify({ message: 'Failed to generate content.' }), { status: 500 });
    }
}