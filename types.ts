export type Theme = 'light' | 'dark' | 'ocean' | 'forest';
export type Device = 'desktop' | 'tablet' | 'mobile';

// NEW: Global Styles
export interface GlobalColor {
    id: string;
    name: string;
    value: string;
}
export interface GlobalTypography {
    id: string;
    name: string;
    styles: ResponsiveStyles;
}


// STYLING TYPES
export interface StyleProperties {
  // Spacing
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  gap?: string;
  // Typography
  color?: string;
  fontSize?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle?: 'normal' | 'italic' | 'oblique';
  textDecoration?: 'none' | 'underline' | 'line-through' | 'overline';
  textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
  lineHeight?: string;
  letterSpacing?: string;
  textShadow?: string;
  // Background
  backgroundColor?: string;
  backgroundImage?: string; // For gradients and images
  backgroundSize?: 'auto' | 'cover' | 'contain';
  backgroundPosition?: string;
  backgroundRepeat?: 'repeat' | 'no-repeat' | 'repeat-x' | 'repeat-y';
  // Border
  borderRadius?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomLeftRadius?: string;
  borderBottomRightRadius?: string;
  borderWidth?: string;
  borderTopWidth?: string;
  borderRightWidth?: string;
  borderBottomWidth?: string;
  borderLeftWidth?: string;
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  borderTopStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  borderRightStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  borderBottomStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  borderLeftStyle?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
  borderColor?: string;
  borderTopColor?: string;
  borderRightColor?: string;
  borderBottomColor?: string;
  borderLeftColor?: string;
  // Dimensions
  height?: string;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  // Flexbox & Grid
  display?: 'block' | 'inline-block' | 'flex' | 'grid' | 'none';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  alignSelf?: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  flexGrow?: string | number;
  flexShrink?: string | number;
  flexBasis?: string;
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  // Position
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  zIndex?: number;
  // Effects
  opacity?: number | string;
  boxShadow?: string;
  transform?: string;
  filter?: string;
  // Misc
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  aspectRatio?: string;
  cursor?: string;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
}

export type ResponsiveStyles = {
    desktop: StyleProperties;
    tablet: StyleProperties;
    mobile: StyleProperties;
}

// WEBSITE STRUCTURE
export interface WebsiteNode {
    id: string;
    type: string;
    customName?: string;
    styles: ResponsiveStyles;
    hoverStyles?: ResponsiveStyles;
    visibility?: { [key in Device]?: boolean };
    animation?: 'none' | 'slideInUp' | 'fadeIn' | 'slideInLeft' | 'slideInRight' | 'scaleUp';
    customCss?: string;
    locked?: boolean;
    children?: WebsiteNode[];
    content?: any;
}

export interface Section extends WebsiteNode {
    type: 'section';
    children: Row[];
}

export interface Row extends WebsiteNode {
    type: 'row';
    children: Column[];
}

export interface Column extends WebsiteNode {
    type: 'column';
    children: Element[];
}

export interface Element extends WebsiteNode {
    type: ElementType;
    children?: undefined;
}

export type ElementType = 
  | 'headline' | 'text' | 'image' | 'button' | 'spacer' | 'icon' | 'video' 
  | 'form' | 'embed' | 'navigation' | 'gallery' | 'divider' | 'map' 
  | 'accordion' | 'tabs' | 'socialIcons';


// ELEMENT-SPECIFIC CONTENT TYPES
export interface HeadlineElement extends Element { type: 'headline'; content: { level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; text: string; }; }
export interface TextElement extends Element { type: 'text'; content: { text: string; }; }
export interface ImageElement extends Element { type: 'image'; content: { src: string; alt?: string; }; }
export interface ButtonElement extends Element { type: 'button'; content: { text: string; href: string; }; }
export interface SpacerElement extends Element { type: 'spacer'; content: {}; }
export interface IconElement extends Element { type: 'icon'; content: { name: string; }; }
export interface VideoElement extends Element { type: 'video', content: { src: string; autoplay?: boolean; loop?: boolean; muted?: boolean; controls?: boolean; } }
export interface FormField { id: string; type: 'text' | 'email' | 'textarea' | 'checkbox' | 'select'; label: string; placeholder?: string; required?: boolean; options?: string[]; }
export interface FormElement extends Element { type: 'form', content: { buttonText: string; fields: FormField[]; } }
export interface EmbedElement extends Element { type: 'embed', content: { html: string; } }
// FEAT: Navigation now uses a customizable list of links.
export interface NavLink { id: string; text: string; type: 'internal' | 'external'; pageId?: string; href?: string; openInNewTab: boolean; }
export interface NavigationElement extends Element { type: 'navigation'; content: { links: NavLink[] }; }
export interface GalleryElement extends Element { type: 'gallery'; content: { images: { src: string; alt: string }[] } }
export interface DividerElement extends Element { type: 'divider'; content: {} }
export interface MapElement extends Element { type: 'map'; content: { embedUrl: string; } }
export interface AccordionElement extends Element { type: 'accordion'; content: { items: { id: string; title: string; content: string; }[] } }
export interface TabsElement extends Element { type: 'tabs'; content: { items: { id: string; title: string; content: WebsiteNode[] }[] } }
export interface SocialIconsElement extends Element { type: 'socialIcons'; content: { networks: { id: string; network: 'facebook' | 'twitter' | 'instagram' | 'linkedin'; url: string }[] } }

export interface Page {
    id: string;
    name: string;
    slug: string;
    isHomepage?: boolean;
    isDraft?: boolean;
    // SEO & Page Specific settings
    tagline?: string;
    heroImageUrl?: string;
    metaTitle?: string;
    metaDescription?: string;
    ogImageUrl?: string;
    password?: string;
    customHeadCode?: string;
    customBodyCode?: string;
    // Content
    children: Section[];
}

export interface WebsiteData {
    id: string;
    name: string;
    theme: Theme;
    faviconUrl?: string;
    googleFont?: string;
    customHeadCode?: string;
    customCursor?: string;
    header: Section[];
    footer: Section[];
    pages: Page[];
    palette: {
        primary: string;
        secondary: string;
        text: string;
        accent: string;
    };
    assets: { id: string; name: string; url: string }[];
    globalStyles: {
        colors: GlobalColor[];
        typography: GlobalTypography[];
    };
    // FEAT: Added metadata for dashboard.
    lastUpdatedAt?: string;
    createdAt?: string;
    tags?: string[];
    // Mocks for dashboard UI
    analytics?: { views: number; visitors: number; };
    seoScore?: number;
    formSubmissions?: number;
}


// MISC
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

export type Session = {
    isAuthenticated: boolean;
    type: 'admin' | 'user' | null;
    username: string | null;
}
