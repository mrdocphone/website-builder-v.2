import type { WebsiteData, Section, Element, Page } from '../types';

/**
 * Generates content for a given section using the Gemini API via our own backend endpoint.
 * @param websiteData - The global website data for context.
 * @param pageTagline - The tagline of the page containing the section.
 * @param section - The specific section to generate content for.
 * @returns A promise that resolves to an array of generated elements.
 */
// FIX: Added pageTagline parameter to provide better context to the AI, as tagline is a property of a Page, not WebsiteData.
export const generateSectionContent = async (
  websiteData: WebsiteData,
  pageTagline: string,
  section: Section
): Promise<Element[][]> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: websiteData.name,
        // FIX: Use the passed pageTagline instead of trying to access a non-existent property on websiteData.
        tagline: pageTagline,
        section,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate content.');
    }

    const generatedElements = await response.json();
    return generatedElements;
  } catch (error) {
    console.error('Error generating section content:', error);
    throw error;
  }
};