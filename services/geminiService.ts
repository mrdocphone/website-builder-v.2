// This service has been disabled.
// The AI content generation feature was based on a legacy data model and is no longer compatible with the application.
import type { WebsiteData } from '../types';

/**
 * This function is part of a disabled feature. It will throw an error if called.
 * The AI content generation feature was removed because it was incompatible with the
 * current data structure and was not being used in the UI.
 */
export const generateSectionContent = async (
  websiteData: WebsiteData,
  section: any // The 'section' object here uses a legacy structure.
): Promise<any> => {
  console.warn("The 'generateSectionContent' function is part of a disabled feature and should not be called.");
  throw new Error("The AI content generation feature has been disabled due to incompatibility with the current data structure.");
};
