export type Theme = 'light' | 'dark' | 'ocean' | 'forest';

// Base Section Structure
interface SectionBase<T extends string, C> {
  id: string;
  type: T;
  content: C;
}

// Section-specific Content Types
export type AboutSectionContent = { title: string; body: string; };
export type ServicesSectionContent = { title: string; services: { id: string; name: string; description: string; }[]; };
export type GallerySectionContent = { title: string; images: { id: string; url: string; alt: string; }[]; };
export type TestimonialsSectionContent = { title: string; testimonials: { id: string; quote: string; author: string; }[]; };
export type ContactSectionContent = { title: string; address: string; phone: string; email: string; };

// Discriminated Union for all Section types
export type Section =
  | SectionBase<'about', AboutSectionContent>
  | SectionBase<'services', ServicesSectionContent>
  | SectionBase<'gallery', GallerySectionContent>
  | SectionBase<'testimonials', TestimonialsSectionContent>
  | SectionBase<'contact', ContactSectionContent>;

export type SectionType = Section['type'];

export interface WebsiteData {
  businessName: string;
  tagline: string;
  heroImageUrl: string;
  theme: Theme;
  sections: Section[];
}

export interface ThemeConfig {
  bg: string;
  text: string;
  primary: string;
  primaryText: string;
  secondary: string;
  footerBg: string;
  footerText: string;
  headerText: string;
}