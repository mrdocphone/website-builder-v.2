import type { WebsiteData, Section, AboutSectionContent, ServicesSectionContent, GallerySectionContent, TestimonialsSectionContent } from '../types';

/**
 * This function calls the Gemini API via our own serverless function endpoint.
 * The API key is used securely on the server, not exposed in the browser.
 */
export const generateSectionContent = async (
  websiteData: WebsiteData,
  section: Section
): Promise<Partial<AboutSectionContent | ServicesSectionContent | GallerySectionContent | TestimonialsSectionContent>> => {
  
  try {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ websiteData, section }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "An unexpected server error occurred." }));
        throw new Error(errorData.message || `Server responded with status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;

  } catch (error) {
    console.error("Error calling /api/generate:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate content: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating content.");
  }
};
