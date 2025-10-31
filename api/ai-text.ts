// Vercel Serverless Function
import { GoogleGenAI } from '@google/genai';

export const config = {
  runtime: 'edge',
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const getPromptForAction = (action: string, text: string, tone?: string): string => {
    switch (action) {
        case 'improve':
            return `You are an expert copy-editor. Improve the following text by correcting grammar, improving clarity, and enhancing the flow. Do not add any extra commentary, just return the improved text.\n\nOriginal Text: "${text}"`;
        case 'shorten':
            return `You are an expert copy-editor. Shorten the following text while preserving its core meaning and key information. Do not add any extra commentary, just return the shortened text.\n\nOriginal Text: "${text}"`;
        case 'lengthen':
            return `You are an expert copywriter. Expand on the following text, adding more detail, examples, or explanation to make it more comprehensive. Do not add any extra commentary, just return the lengthened text.\n\nOriginal Text: "${text}"`;
        case 'change-tone':
            return `You are an expert copywriter. Rewrite the following text to have a ${tone || 'professional'} tone. Do not add any extra commentary, just return the rewritten text.\n\nOriginal Text: "${text}"`;
        case 'generate':
             return `You are an expert copywriter for a business website. The user has an element with the placeholder text "${text}". Generate new, context-aware content to replace it. Be concise and professional. Do not add any extra commentary, just return the generated text.`;
        default:
            throw new Error(`Invalid action: ${action}`);
    }
}

export default async function handler(request: Request) {
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405 });
    }

    try {
        const { text, action, tone } = await request.json();

        if (!text || !action) {
            return new Response(JSON.stringify({ message: 'Text and action are required.' }), { status: 400 });
        }

        const prompt = getPromptForAction(action, text, tone);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const newText = response.text.trim();

        return new Response(JSON.stringify({ newText }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in /api/ai-text:', error);
        return new Response(JSON.stringify({ message: error instanceof Error ? error.message : 'Failed to generate text.' }), { status: 500 });
    }
}