
export type Theme = 'light' | 'dark' | 'ocean' | 'forest';

// STYLING TYPES
export interface Styles {
  // Spacing
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  marginTop?: string;
  marginBottom?: string;
  // Typography
  color?: string;
  fontSize?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontWeight?: 'normal' | 'bold';
  // FIX: Add fontStyle property to fix type error on App.tsx line 88.
  fontStyle?: 'normal' | 'italic' | 'oblique';
  // Background
  backgroundColor?: string;
  // Border
  borderRadius?: string;
  // etc.
}

// BASE STRUCTURE for all editable items
interface StructureNode<T extends string> {
  id: string;
  type: T;
  styles: Styles;
}

// CONTENT ELEMENT TYPES
export type ElementType = 'headline' | 'text' | 'image' | 'button';

export interface HeadlineElement extends StructureNode<'headline'> {
  content: { text: string; level: 'h1' | 'h2' | 'h3' };
}
export interface TextElement extends StructureNode<'text'> {
  content: { text: string };
}
export interface ImageElement extends StructureNode<'image'> {
  content: { src: string; alt: string };
}
export interface ButtonElement extends StructureNode<'button'> {
  content: { text: string; href: string };
}

export type Element = HeadlineElement | TextElement | ImageElement | ButtonElement;

// LAYOUT STRUCTURE TYPES
export interface Column extends StructureNode<'column'> {
  children: Element[];
}
export interface Row extends StructureNode<'row'> {
  children: Column[];
}
export interface Section extends StructureNode<'section'> {
  children: Row[];
}

// Combined type for any node in the structure tree
export type WebsiteNode = Section | Row | Column | Element;

// TOP-LEVEL WEBSITE DATA
export interface WebsiteData {
  businessName: string;
  tagline: string;
  slug: string;
  theme: Theme;
  heroImageUrl: string; // Kept for simplicity of the top hero
  children: Section[]; // The main page content
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

// FIX: Moved from App.tsx to break circular dependency.
export interface Session {
    isAuthenticated: boolean;
    type: 'admin' | 'user' | null;
    username: string | null;
}
