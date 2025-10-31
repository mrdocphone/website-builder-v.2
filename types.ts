


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
  // Layout (Flexbox & Grid)
  display?: 'flex' | 'grid' | 'block' | 'inline-block' | 'inline' | 'none';
  // Flex Container
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  // Flex Child
  flexBasis?: string;
  flexGrow?: string;
  flexShrink?: string;
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  order?: string;
  // Grid Container
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridColumnGap?: string;
  gridRowGap?: string;
  // Grid Child
  gridColumnStart?: string;
  gridColumnEnd?: string;
  gridRowStart?: string;
  gridRowEnd?: string;
  // Positioning
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: string;
  // Effects & Misc
  boxShadow?: string;
  opacity?: string;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  cursor?: string;
  filter?: string; // For image filters
  transform?: string;
  transformOrigin?: string;
  transition?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
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
  customName?: string; // For layer renaming
  styles: ResponsiveStyles;
  hoverStyles?: ResponsiveStyles; // For hover effects
  animation?: 'none' | 'fadeIn' | 'slideInUp' | 'slideInLeft' | 'slideInRight' | 'scaleUp';
  locked?: boolean; // To prevent editing
  visibility?: { // To hide on specific devices
      [key in Device]?: boolean;
  };
  customCss?: string;
  globalTypographyId?: string; // ID of a global typography style
}

// CONTENT ELEMENT TYPES
export type ElementType = 'headline' | 'text' | 'image' | 'button' | 'spacer' | 'icon' | 'video' | 'form' | 'embed' | 'navigation' | 'gallery' | 'divider' | 'map' | 'accordion' | 'tabs' | 'socialIcons';

export interface HeadlineElement extends StructureNode<'headline'> {
  content: { text: string; level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' };
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
    content: { 
        src: string;
        autoplay?: boolean;
        loop?: boolean;
        muted?: boolean;
        controls?: boolean;
    };
}
// NEW: Advanced Form Element
export type FormFieldType = 'text' | 'email' | 'textarea' | 'checkbox' | 'select';
export interface FormField {
    id: string;
    type: FormFieldType;
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[]; // For select type
}
export interface FormElement extends StructureNode<'form'> {
    content: { 
        buttonText: string;
        fields: FormField[];
    };
}
export interface EmbedElement extends StructureNode<'embed'> {
    content: { html: string };
}
export interface NavigationElement extends StructureNode<'navigation'> {
    content: {}; // Content is generated from pages
}
export interface GalleryElement extends StructureNode<'gallery'> {
    content: { images: { src: string; alt: string }[] };
}
export interface DividerElement extends StructureNode<'divider'> {
    content: {}; // Styled via style panel
}
export interface MapElement extends StructureNode<'map'> {
    content: { embedUrl: string };
}

// NEW Elements
export interface AccordionElement extends StructureNode<'accordion'> {
    content: {
        items: {
            id: string;
            title: string;
            content: string;
        }[];
    };
}
export interface TabsElement extends StructureNode<'tabs'> {
    content: {
        items: {
            id: string;
            title: string;
            content: Element[];
        }[];
    };
}
export interface SocialIconsElement extends StructureNode<'socialIcons'> {
    content: {
        networks: {
            id: string;
            network: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube';
            url: string;
        }[];
    };
}


export type Element = HeadlineElement | TextElement | ImageElement | ButtonElement | SpacerElement | IconElement | VideoElement | FormElement | EmbedElement | NavigationElement | GalleryElement | DividerElement | MapElement | AccordionElement | TabsElement | SocialIconsElement;

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

// Page Structure
export interface Page {
  id: string;
  name: string;
  slug: string;
  isHomepage: boolean;
  isDraft?: boolean; // To hide from published site
  password?: string; // For password protection
  heroImageUrl: string;
  tagline: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string; // Social sharing image
  customHeadCode?: string; // Per-page custom code
  customBodyCode?: string; // Per-page custom code (end of body)
  children: Section[];
}

// TOP-LEVEL WEBSITE DATA
export interface WebsiteData {
  id: string;
  name: string;
  theme: Theme;
  faviconUrl?: string;
  googleFont?: string;
  customCursor?: string;
  customHeadCode?: string; // Site-wide custom code
  header: Section[]; // Global Header
  footer: Section[]; // Global Footer
  palette: {
      primary: string;
      secondary: string;
      text: string;
      accent: string;
  };
  globalStyles: {
      colors: GlobalColor[];
      typography: GlobalTypography[];
  };
  assets: { id: string, name: string, url: string }[];
  pages: Page[];
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

export interface Session {
    isAuthenticated: boolean;
    type: 'admin' | 'user' | null;
    username: string | null;
}