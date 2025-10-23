import { GoogleGenAI, Type } from "@google/genai";
import type { WebsiteData, Section, AboutSectionContent, ServicesSectionContent, GallerySectionContent, TestimonialsSectionContent } from '../types';
import { v4 as uuidv4 } from 'uuid';

// --- Helper Functions to create prompts and define response schemas ---

const generatePrompt = (websiteData: WebsiteData, section: Section): string => {
  const baseIntro = `You are a professional copywriter for a small business website builder.
Your task is to generate content for a specific section of a website.
The tone should be professional, warm, and trustworthy.
Do not use markdown or special formatting.

Business Name: "${websiteData.businessName}"
Tagline: "${websiteData.tagline}"
---
`;

  switch (section.type) {
    case 'about':
      return `${baseIntro}
Section to generate: About Us
Current content: "${section.content.body}"
Task: Enhance the current content or write a new "About Us" section of about 2-3 paragraphs.
Return ONLY the new body text as a plain string.`;
    
    case 'services':
       return `${baseIntro}
Section to generate: Services
Task: Based on the business name and tagline, suggest 3 distinct services this business might offer.
Return a JSON object with a "services" key, which is an array of objects, each with a "name" and "description" property. Example: {"services":[{"name": "Service 1", "description": "Description 1"}]}`;

    case 'gallery':
       return `${baseIntro}
Section to generate: Gallery
Task: Based on the business name, suggest 3 relevant gallery image descriptions.
Return a JSON object with an "images" key, which is an array of objects, each with a "url" and "alt" property. For the URL, use a placeholder from picsum.photos like "https://picsum.photos/400/300?random=1". Example: {"images":[{"url": "https://picsum.photos/400/300?random=1", "alt": "A relevant image description."}]}`;

    case 'testimonials':
       return `${baseIntro}
Section to generate: Testimonials
Task: Based on the business name and tagline, invent 2 short, positive testimonials from fictional customers.
Return a JSON object with a "testimonials" key, which is an array of objects, each with a "quote" and "author" property. Example: {"testimonials":[{"quote": "Great service!", "author": "Happy Customer"}]}`;
    
    default:
      return `${baseIntro}
Task: Suggest a short, single paragraph of content for a section titled "${(section.content as any).title}".`;
  }
};

const getResponseSchema = (sectionType: Section['type']) => {
    switch (sectionType) {
        case 'services':
            return {
                type: Type.OBJECT,
                properties: {
                    services: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                            }
                        }
                    }
                }
            };
        case 'gallery':
             return {
                type: Type.OBJECT,
                properties: {
                    images: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                url: { type: Type.STRING },
                                alt: { type: Type.STRING },
                            }
                        }
                    }
                }
            };
        case 'testimonials':
            return {
                type: Type.OBJECT,
                properties: {
                    testimonials: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                quote: { type: Type.STRING },
                                author: { type: Type.STRING },
                            }
                        }
                    }
                }
            };
        default:
            return null; // For plain text responses
    }
}


/**
 * This function calls the Gemini API directly from the client-side.
 */
export const generateSectionContent = async (
  websiteData: WebsiteData,
  section: Section
): Promise<Partial<AboutSectionContent | ServicesSectionContent | GallerySectionContent | TestimonialsSectionContent>> => {
  
  if (!process.env.API_KEY) {
      throw new Error("API_KEY is not configured. Please set it up in your environment variables.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = generatePrompt(websiteData, section);
    const responseSchema = getResponseSchema(section.type);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: responseSchema ? {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      } : {},
    });

    const text = response.text.trim();
    let result;

    if (responseSchema) {
        const parsedJson = JSON.parse(text);
        // Add unique IDs to list items, which React uses for rendering.
        if (section.type === 'services' && parsedJson.services) {
            parsedJson.services.forEach((item: any) => item.id = uuidv4());
        } else if (section.type === 'gallery' && parsedJson.images) {
            parsedJson.images.forEach((item: any) => item.id = uuidv4());
        } else if (section.type === 'testimonials' && parsedJson.testimonials) {
            parsedJson.testimonials.forEach((item: any) => item.id = uuidv4());
        }
        result = parsedJson;
    } else {
        // For simple text generation like the 'about' section.
        result = { body: text };
    }
    
    return result;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate content from the AI service: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI service.");
  }
};