
export type Theme = 'light' | 'dark' | 'ocean' | 'forest';
export type Device = 'desktop' | 'tablet' | 'mobile';

// STYLING TYPES
export interface StyleProperties {
  // Spacing
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  marginTop?: string;
  marginBottom?: string;
  gap?: string;
  // Typography
  color?: string;
  fontSize?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic' | 'oblique';
  // Background
  backgroundColor?: string;
  backgroundImage?: string; // For gradients and images
  // Border
  borderRadius?: string;
  // Dimensions
  height?: string; // For Spacer
  width?: string;
  // Layout (Flexbox)
  display?: 'flex';
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
}

export type ResponsiveStyles = {
    desktop: StyleProperties;
    tablet: StyleProperties;
    mobile: StyleProperties;
}

// BASE STRUCTURE for all editable items
interface StructureNode<T extends string> {
  id: string;
  type: T;
  styles: ResponsiveStyles;
}

// CONTENT ELEMENT TYPES
export type ElementType = 'headline' | 'text' | 'image' | 'button' | 'spacer' | 'icon' | 'video' | 'form' | 'embed';

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
export interface SpacerElement extends StructureNode<'spacer'> {
    content: {}; // No content
}
export interface IconElement extends StructureNode<'icon'> {
    content: { name: string };
}
export interface VideoElement extends StructureNode<'video'> {
    content: { src: string };
}
export interface FormElement extends StructureNode<'form'> {
    content: { buttonText: string };
}
export interface EmbedElement extends StructureNode<'embed'> {
    content: { html: string };
}


export type Element = HeadlineElement | TextElement | ImageElement | ButtonElement | SpacerElement | IconElement | VideoElement | FormElement | EmbedElement;

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
  id: string;
  name: string;
  tagline: string;
  slug: string;
  theme: Theme;
  heroImageUrl: string; // Kept for simplicity of the top hero
  palette: {
      primary: string;
      secondary: string;
      text: string;
      accent: string;
  };
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