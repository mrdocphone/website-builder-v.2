
import type { WebsiteData, Section, Element } from '../types';

/**
 * Generates content for a given section using the Gemini API via our own backend endpoint.
 * @param websiteData - The global website data for context.
 * @param section - The specific section to generate content for.
 * @returns A promise that resolves to an array of generated elements.
 */
export const generateSectionContent = async (
  websiteData: WebsiteData,
  section: Section
): Promise<Element[][]> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessName: websiteData.businessName,
        tagline: websiteData.tagline,
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
