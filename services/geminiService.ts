import type { WebsiteData } from '../types';

/**
 * This function now calls our own secure API endpoint on the server,
 * which then calls the Gemini API. This prevents exposing the API key on the client.
 */
export const generateSectionContent = async (
  websiteData: WebsiteData,
  section: any // The 'section' object here uses a legacy structure, not the new 'Section' type from ../types.
): Promise<any> => { // The return type from the AI API is dynamic, so 'any' is appropriate here.
  
  try {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ websiteData, section }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // try to parse json, but don't fail if it's not
        throw new Error(errorData.message || 'The AI service failed to generate content.');
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error("Error fetching from /api/generate:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate content: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating content.");
  }
};
