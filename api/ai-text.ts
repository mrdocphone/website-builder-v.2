// Vercel Serverless Function
import { GoogleGenAI } from '@google/genai';

export const config = {
  runtime: 'edge',
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const getPromptForAction = (action: string, text: string, tone?: string): string => {
    const baseInstruction = `You are an expert copy-editor. Your task is to modify the provided HTML content.
IMPORTANT: You MUST preserve all HTML tags (like <b>, <i>, <a>, <span>, etc.) and their attributes exactly as they are. Only modify the text content within the tags. Do not add any extra commentary or markdown. Return only the modified HTML content.`;

    switch (action) {
        case 'improve':
            return `${baseInstruction}\n\nImprove the following HTML by correcting grammar, improving clarity, and enhancing flow:\n\n${text}`;
        case 'shorten':
            return `${baseInstruction}\n\nShorten the text within the following HTML while preserving its core meaning:\n\n${text}`;
        case 'lengthen':
            return `${baseInstruction}\n\nExpand on the text within the following HTML, adding more detail or explanation:\n\n${text}`;
        case 'change-tone':
            return `${baseInstruction}\n\nRewrite the text within the following HTML to have a ${tone || 'professional'} tone:\n\n${text}`;
        case 'generate':
             return `You are an expert copywriter for a business website. The user has an element with this placeholder text: "${text}". Generate new, professional content to replace it. Wrap key phrases in <b> tags if appropriate. Return only the generated HTML.`;
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