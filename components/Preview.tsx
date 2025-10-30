import React, { useMemo } from 'react';
import type { WebsiteData, ThemeConfig, Theme, WebsiteNode, Element as ElementType, HeadlineElement, TextElement, ImageElement, ButtonElement } from '../types';

interface PreviewProps {
  websiteData: WebsiteData;
}

const themeConfigs: Record<Theme, ThemeConfig> = {
  light: { bg: 'bg-white', text: 'text-slate-700', primary: 'bg-indigo-600', primaryText: 'text-white', secondary: 'bg-slate-50', footerBg: 'bg-slate-800', footerText: 'text-slate-200', headerText: 'text-slate-800' },
  dark: { bg: 'bg-gray-800', text: 'text-gray-200', primary: 'bg-indigo-500', primaryText: 'text-white', secondary: 'bg-gray-700', footerBg: 'bg-black', footerText: 'text-gray-300', headerText: 'text-white' },
  ocean: { bg: 'bg-blue-50', text: 'text-blue-900', primary: 'bg-blue-600', primaryText: 'text-white', secondary: 'bg-blue-100', footerBg: 'bg-blue-900', footerText: 'text-blue-100', headerText: 'text-blue-900' },
  forest: { bg: 'bg-green-50', text: 'text-green-900', primary: 'bg-green-700', primaryText: 'text-white', secondary: 'bg-green-100', footerBg: 'bg-green-900', footerText: 'text-green-100', headerText: 'text-green-900' },
};


// The ElementRenderer logic has been moved here from SectionEditorForm.tsx
// to fix a critical rendering bug and improve code co-location.
const ElementRenderer: React.FC<{ element: ElementType }> = React.memo(({ element }) => {
    // CRITICAL FIX: A missing, null, or non-object `content` property on an element
    // from the database would cause a crash. This improved guard handles corrupted 
    // data gracefully by checking the type.
    if (!element.content || typeof element.content !== 'object') {
        return null;
    }
  
    switch (element.type) {
        case 'headline': {
            const { level, text } = element.content as HeadlineElement['content'];
            // FIX: Add validation for the 'level' property. If it's missing or invalid,
            // default to 'h2' to prevent a rendering crash.
            const Tag = (level && ['h1', 'h2', 'h3'].includes(level)) ? level : 'h2';
            return (
                <Tag>
                    {text}
                </Tag>
            );
        }
        case 'text': {
            const { text } = element.content as TextElement['content'];
            return (
                <p className="whitespace-pre-wrap">
                    {text}
                </p>
            );
        }
        case 'image': {
            const { src, alt } = element.content as ImageElement['content'];
            // An image without a source URL is invalid and should not be rendered.
            if (!src) {
                return null;
            }
            return <img src={src} alt={alt || ''} className="max-w-full h-auto" />;
        }
        case 'button': {
            const { text, href } = element.content as ButtonElement['content'];
            // A button without text or a link is invalid and should not be rendered.
            if (!text || !href) {
                return null;
            }
            return (
                <a 
                    href={href} 
                    className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-md no-underline"
                >
                    <span>
                        {text}
                    </span>
                </a>
            );
        }
        default:
            return null;
    }
});


const NodeRenderer: React.FC<{ node: WebsiteNode }> = ({ node }) => {
    // CRITICAL FIX: Add comprehensive checks to prevent rendering crashes from corrupted data.
    // A node must have an id and type to be valid.
    if (!node || !node.id || !node.type) {
        console.warn('Skipping rendering of invalid or corrupted node:', node);
        return null;
    }
    
    // Base case: render an element (leaf node).
    if (!('children' in node) || !Array.isArray(node.children)) {
      return (
        // Ensure styles is an object to prevent crashes.
        <div style={node.styles || {}}>
          <ElementRenderer element={node as ElementType} />
        </div>
      );
    }
  
    // Recursive case: render a layout container (branch node).
    let className = '';
    let Tag: React.ElementType = 'div';
    
    switch(node.type) {
        case 'section':
            Tag = 'section';
            className = 'py-8 px-4 md:py-12 md:px-6';
            break;
        case 'row':
            className = 'flex flex-wrap -mx-2';
            break;
        case 'column':
            className = 'flex-1 p-2';
            break;
        default:
             // Handle unknown types gracefully instead of crashing.
            // FIX: The switch is exhaustive, so `node` is `never` here. Cast to `any` to access `type` for logging.
            console.warn(`Encountered unknown node type: "${(node as any).type}". Rendering as a generic container.`);
            break;
    }

    return (
        // Ensure styles is an object to prevent crashes.
        <Tag className={className} style={node.styles || {}}>
            {node.children
                // Filter out any child that is falsey or missing an ID. This is crucial 
                // to prevent React key errors and rendering crashes from corrupted data.
                .filter(child => child && child.id)
                .map(child => (
                    <NodeRenderer key={child.id} node={child} />
                ))
            }
        </Tag>
    );
};

const Preview: React.FC<PreviewProps> = ({ websiteData }) => {
  const theme = useMemo(() => themeConfigs[websiteData.theme] || themeConfigs.light, [websiteData.theme]);

  return (
    <div className={`w-full h-full overflow-y-auto ${theme.bg} ${theme.text} transition-colors duration-300`}>
      {/* Header */}
      <header className={`p-6 sticky top-0 ${theme.bg} bg-opacity-80 backdrop-blur-sm z-20`}>
        <h1 className={`text-2xl font-bold ${theme.headerText}`}>{websiteData.businessName}</h1>
      </header>

      {/* Hero Section */}
      <section className="relative h-72">
        <img src={websiteData.heroImageUrl} alt={`${websiteData.businessName} hero image`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-white">{websiteData.businessName}</h2>
            <p className="mt-2 text-lg text-slate-200">{websiteData.tagline}</p>
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      <main>
        {websiteData.children && websiteData.children.filter(Boolean).map(section => (
            <NodeRenderer key={section.id} node={section} />
        ))}
      </main>

      {/* Footer */}
      <footer className={`py-6 px-6 text-center ${theme.footerBg} ${theme.footerText}`}>
        <p>&copy; {new Date().getFullYear()} {websiteData.businessName}. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default React.memo(Preview);