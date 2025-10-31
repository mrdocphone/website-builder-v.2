import React, { useMemo } from 'react';
import type { WebsiteData, ThemeConfig, Theme, WebsiteNode, Element as ElementType, HeadlineElement, TextElement, ImageElement, ButtonElement, Column } from '../types';
import { PlusIcon } from './icons';

interface PreviewProps {
  websiteData: WebsiteData;
  interactive?: boolean;
  selectedNodeId?: string | null;
  hoveredNodeId?: string | null;
  onSelectNode?: (id: string) => void;
  onHoverNode?: (id: string | null) => void;
  onAddElement?: (parentId: string, type: ElementType['type']) => void;
}

const themeConfigs: Record<Theme, ThemeConfig> = {
  light: { bg: 'bg-white', text: 'text-slate-700', primary: 'bg-indigo-600', primaryText: 'text-white', secondary: 'bg-slate-50', footerBg: 'bg-slate-800', footerText: 'text-slate-200', headerText: 'text-slate-800' },
  dark: { bg: 'bg-gray-800', text: 'text-gray-200', primary: 'bg-indigo-500', primaryText: 'text-white', secondary: 'bg-gray-700', footerBg: 'bg-black', footerText: 'text-gray-300', headerText: 'text-white' },
  ocean: { bg: 'bg-blue-50', text: 'text-blue-900', primary: 'bg-blue-600', primaryText: 'text-white', secondary: 'bg-blue-100', footerBg: 'bg-blue-900', footerText: 'text-blue-100', headerText: 'text-blue-900' },
  forest: { bg: 'bg-green-50', text: 'text-green-900', primary: 'bg-green-700', primaryText: 'text-white', secondary: 'bg-green-100', footerBg: 'bg-green-900', footerText: 'text-green-100', headerText: 'text-green-900' },
};


const ElementRenderer: React.FC<{ element: ElementType, theme: ThemeConfig }> = React.memo(({ element, theme }) => {
    if (!element.content || typeof element.content !== 'object') {
        return null;
    }
  
    switch (element.type) {
        case 'headline': {
            const { level, text } = element.content as HeadlineElement['content'];
            const Tag = (level && ['h1', 'h2', 'h3'].includes(level)) ? level : 'h2';
            const sizeClasses = { h1: 'text-4xl font-bold', h2: 'text-3xl font-bold', h3: 'text-2xl font-semibold' };
            return ( <Tag className={sizeClasses[Tag]}>{text}</Tag> );
        }
        case 'text': {
            const { text } = element.content as TextElement['content'];
            return ( <p className="whitespace-pre-wrap leading-relaxed">{text}</p> );
        }
        case 'image': {
            const { src, alt } = element.content as ImageElement['content'];
            if (!src) { return null; }
            return <img src={src} alt={alt || ''} className="max-w-full h-auto rounded-md" />;
        }
        case 'button': {
            const { text, href } = element.content as ButtonElement['content'];
            if (!text || !href) { return null; }
            return (
                <a href={href} className={`inline-block ${theme.primary} ${theme.primaryText} px-6 py-3 rounded-md font-semibold no-underline`}>
                    <span>{text}</span>
                </a>
            );
        }
        default:
            return null;
    }
});


const InteractiveWrapper: React.FC<React.PropsWithChildren<{
    node: WebsiteNode;
    interactive?: boolean;
    isSelected?: boolean;
    isHovered?: boolean;
    onSelect?: (id: string) => void;
    onHover?: (id: string | null) => void;
}>> = ({ children, node, interactive, isSelected, isHovered, onSelect, onHover }) => {
    if (!interactive) {
        return <>{children}</>;
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect?.(node.id);
    };

    const handleMouseEnter = (e: React.MouseEvent) => {
        e.stopPropagation();
        onHover?.(node.id);
    };

    const handleMouseLeave = (e: React.MouseEvent) => {
        e.stopPropagation();
        onHover?.(null);
    };

    const wrapperClasses = [
        'interactive-wrapper',
        isSelected ? 'selected' : '',
        isHovered ? 'hovered' : ''
    ].join(' ').trim();

    return (
        <div
            className={wrapperClasses}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </div>
    );
};

const NodeRenderer: React.FC<Omit<PreviewProps, 'websiteData'> & { node: WebsiteNode, theme: ThemeConfig }> = (props) => {
    const { node, theme } = props;

    if (!node || !node.id || !node.type) {
        console.warn('Skipping rendering of invalid node:', node);
        return null;
    }
    
    const isSelected = props.interactive && props.selectedNodeId === node.id;
    const isHovered = props.interactive && props.hoveredNodeId === node.id && !isSelected;

    if (!('children' in node) || !Array.isArray(node.children)) {
      return (
        <InteractiveWrapper {...props} node={node} isSelected={isSelected} isHovered={isHovered}>
            <div style={node.styles || {}}>
                <ElementRenderer element={node as ElementType} theme={theme} />
            </div>
        </InteractiveWrapper>
      );
    }
  
    let className = '';
    let Tag: React.ElementType = 'div';
    
    switch(node.type) {
        case 'section':
            Tag = 'section';
            className = 'py-8 px-4 md:py-12 md:px-6';
            break;
        case 'row':
            className = 'flex flex-wrap -mx-4';
            break;
        case 'column':
            className = 'w-full md:w-1/2 p-4 flex flex-col gap-4';
             if ((node as Column).children.length === 0 && props.interactive) {
                return (
                    <div className={className}>
                        <div className="empty-column-placeholder">
                             <button onClick={() => props.onAddElement?.(node.id, 'headline')} className="bg-slate-200 text-slate-600 px-4 py-2 rounded-md text-sm hover:bg-slate-300">
                                <PlusIcon className="w-4 h-4 inline-block mr-2" />
                                Add Element
                            </button>
                        </div>
                    </div>
                );
            }
            break;
        default:
            console.warn(`Encountered unknown node type: "${(node as any).type}".`);
            break;
    }

    return (
        <InteractiveWrapper {...props} node={node} isSelected={isSelected} isHovered={isHovered}>
            <Tag className={className} style={node.styles || {}}>
                {node.children
                    .filter(child => child && child.id)
                    .map(child => (
                        <NodeRenderer key={child.id} {...props} node={child} />
                    ))
                }
            </Tag>
        </InteractiveWrapper>
    );
};

const Preview: React.FC<PreviewProps> = (props) => {
  const { websiteData } = props;
  const theme = useMemo(() => themeConfigs[websiteData.theme] || themeConfigs.light, [websiteData.theme]);

  return (
    <div className={`w-full h-full overflow-y-auto ${theme.bg} ${theme.text} transition-colors duration-300`}>
      <header className={`p-6 sticky top-0 ${theme.bg} bg-opacity-80 backdrop-blur-sm z-20`}>
        <h1 className={`text-2xl font-bold ${theme.headerText}`}>{websiteData.name}</h1>
      </header>

      <section className="relative h-72">
        <img src={websiteData.heroImageUrl} alt={`${websiteData.name} hero image`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-white">{websiteData.name}</h2>
            <p className="mt-2 text-lg text-slate-200">{websiteData.tagline}</p>
          </div>
        </div>
      </section>

      <main>
        {websiteData.children && websiteData.children.filter(Boolean).map(section => (
            <NodeRenderer key={section.id} {...props} node={section} theme={theme} />
        ))}
      </main>

      <footer className={`py-6 px-6 text-center ${theme.footerBg} ${theme.footerText}`}>
        <p>&copy; {new Date().getFullYear()} {websiteData.name}. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default React.memo(Preview);