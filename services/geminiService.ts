import type { WebsiteData, Section, AboutSectionContent, ServicesSectionContent, GallerySectionContent, TestimonialsSectionContent } from '../types';

/**
 * This function now acts as a client-side wrapper. It sends the content generation
 * request to our own secure serverless function (`/api/generate`) instead of
 * calling the Google AI SDK directly from the browser.
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
        const errorData = await response.json().catch(() => ({ message: 'Failed to generate content. The AI service may be temporarily unavailable.' }));
        throw new Error(errorData.message);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("Error calling /api/generate:", error);
    if (error instanceof Error) {
        // Re-throw the specific error message from the server or fetch call
        throw error;
    }
    // Provide a generic fallback error message
    throw new Error("An unknown error occurred while communicating with the AI service.");
  }
};
