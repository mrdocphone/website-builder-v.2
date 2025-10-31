

import React, { useMemo } from 'react';
import type { WebsiteData, ThemeConfig, Theme, WebsiteNode, Element as IElement, HeadlineElement, TextElement, ImageElement, ButtonElement, VideoElement, IconElement, Column, Device, ResponsiveStyles, StyleProperties, EmbedElement, FormElement, Page, NavigationElement, GalleryElement, DividerElement, MapElement } from '../types';
import { PlusIcon, availableIcons, IconRenderer as Icon } from './icons';
import AiToolbar from './AiToolbar';
import RichTextToolbar from './RichTextToolbar';

interface PreviewProps {
  websiteData: WebsiteData;
  activePage: Page;
  interactive?: boolean;
  device?: Device;
  selectedNodeId?: string | null;
  hoveredNodeId?: string | null;
  onSelectNode?: (id: string) => void;
  onHoverNode?: (id: string | null) => void;
  onUpdateNode?: (id: string, updates: Partial<WebsiteNode>) => void;
  onAiTextUpdate?: (nodeId: string, action: string, options?: { tone?: string }) => void;
  isAiLoading?: boolean;
  onContextMenuRequest?: (e: React.MouseEvent, nodeId: string) => void;
  onAddSection?: (context: 'page' | 'header' | 'footer') => void;
}

const themeConfigs: Record<Theme, ThemeConfig> = {
  light: { bg: 'bg-white', text: 'text-slate-700', primary: 'bg-indigo-600', primaryText: 'text-white', secondary: 'bg-slate-50', footerBg: 'bg-slate-800', footerText: 'text-slate-200', headerText: 'text-slate-800' },
  dark: { bg: 'bg-gray-800', text: 'text-gray-200', primary: 'bg-indigo-500', primaryText: 'text-white', secondary: 'bg-gray-700', footerBg: 'bg-black', footerText: 'text-gray-300', headerText: 'text-white' },
  ocean: { bg: 'bg-blue-50', text: 'text-blue-900', primary: 'bg-blue-600', primaryText: 'text-white', secondary: 'bg-blue-100', footerBg: 'bg-blue-900', footerText: 'text-blue-100', headerText: 'text-blue-900' },
  forest: { bg: 'bg-green-50', text: 'text-green-900', primary: 'bg-green-700', primaryText: 'text-white', secondary: 'bg-green-100', footerBg: 'bg-green-900', footerText: 'text-green-100', headerText: 'text-green-900' },
};


const mergeStylesForDevice = (styles: ResponsiveStyles, device: Device): StyleProperties => {
    const mobile = styles.mobile || {};
    const tablet = styles.tablet || {};
    const desktop = styles.desktop || {};

    if (device === 'mobile') {
        return mobile;
    }
    if (device === 'tablet') {
        return { ...mobile, ...tablet };
    }
    return { ...mobile, ...tablet, ...desktop };
};


const ElementRenderer: React.FC<{ 
    element: IElement, 
    theme: ThemeConfig,
    websiteData: WebsiteData,
    interactive?: boolean;
    onUpdateNode?: (id: string, updates: Partial<WebsiteNode>) => void;
}> = React.memo(({ element, theme, websiteData, interactive, onUpdateNode }) => {
    if (!element.content || typeof element.content !== 'object') {
         if (element.type !== 'divider' && element.type !== 'navigation' && element.type !== 'spacer') return null;
    }

    const handleContentInput = (e: React.FormEvent<HTMLElement>) => {
        if (!interactive || !onUpdateNode) return;
        const newHtml = e.currentTarget.innerHTML;
        onUpdateNode(element.id, { content: { ...(element as any).content, text: newHtml } });
    };
  
    switch (element.type) {
        case 'headline': {
            const { level, text } = element.content as HeadlineElement['content'];
            const Tag = (level && ['h1', 'h2', 'h3'].includes(level)) ? level : 'h2';
            const sizeClasses = { h1: 'text-4xl font-bold', h2: 'text-3xl font-bold', h3: 'text-2xl font-semibold' };
            return ( <Tag className={sizeClasses[Tag]} contentEditable={interactive} onInput={handleContentInput} suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: text }} /> );
        }
        case 'text': {
            const { text } = element.content as TextElement['content'];
            return ( <div className="whitespace-pre-wrap leading-relaxed" contentEditable={interactive} onInput={handleContentInput} suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: text }} /> );
        }
        case 'image': {
            const { src, alt } = element.content as ImageElement['content'];
            if (!src) { return null; }
            return <img src={src} alt={alt || ''} className="max-w-full h-auto" />;
        }
        case 'button': {
            const { text, href } = element.content as ButtonElement['content'];
            if (!text || !href) { return null; }
            const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
              if (!interactive || !onUpdateNode) return;
              const newText = e.currentTarget.innerText;
              if (text !== newText) {
                  onUpdateNode(element.id, { content: { ...element.content, text: newText } });
              }
            };
            return (
                <a href={href} className={`inline-block ${theme.primary} ${theme.primaryText} px-6 py-3 rounded-md font-semibold no-underline`}>
                    <span contentEditable={interactive} onBlur={handleBlur} suppressContentEditableWarning>{text}</span>
                </a>
            );
        }
        case 'spacer': {
            return <div />;
        }
        case 'icon': {
            const { name } = element.content as IconElement['content'];
            return <Icon iconName={name} className="w-12 h-12" />;
        }
        case 'video': {
            const { src } = element.content as VideoElement['content'];
            let embedSrc = '';
            if (src.includes('youtube.com/watch?v=')) {
                const videoId = src.split('v=')[1].split('&')[0];
                embedSrc = `https://www.youtube.com/embed/${videoId}`;
            } else if (src.includes('youtu.be/')) {
                const videoId = src.split('youtu.be/')[1].split('?')[0];
                embedSrc = `https://www.youtube.com/embed/${videoId}`;
            } else if (src.includes('vimeo.com/')) {
                const videoId = src.split('vimeo.com/')[1].split('?')[0];
                embedSrc = `https://player.vimeo.com/video/${videoId}`;
            }
            if (!embedSrc) return <div className="p-4 bg-red-100 text-red-700 rounded">Invalid Video URL</div>;
            return (
                <div className="aspect-video w-full">
                    <iframe className="w-full h-full" src={embedSrc} title="Video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                </div>
            )
        }
        case 'form': {
            const { buttonText } = element.content as FormElement['content'];
            return (
                <form className="preview-form" onSubmit={e => e.preventDefault()}>
                    <div className="preview-form-field"><label htmlFor="name">Name</label><input type="text" id="name" name="name" /></div>
                    <div className="preview-form-field"><label htmlFor="email">Email</label><input type="email" id="email" name="email" /></div>
                    <div className="preview-form-field"><label htmlFor="message">Message</label><textarea id="message" name="message" rows={4}></textarea></div>
                    <button type="submit" className="preview-form-button">{buttonText}</button>
                </form>
            );
        }
        case 'embed': {
            const { html } = element.content as EmbedElement['content'];
            return <div dangerouslySetInnerHTML={{ __html: html }} />;
        }
        case 'navigation': {
            return (
                <nav className="preview-nav w-full">
                    <ul>
                        {websiteData.pages.map(page => (
                            <li key={page.id}><a href={`/${page.slug}`}>{page.name}</a></li>
                        ))}
                    </ul>
                </nav>
            )
        }
        case 'gallery': {
            const { images } = element.content as GalleryElement['content'];
            return (
                <div className="preview-gallery">
                    {images.map((img, idx) => <img key={idx} src={img.src} alt={img.alt} />)}
                </div>
            )
        }
        case 'divider': { return <hr />; }
        case 'map': {
            const { embedUrl } = element.content as MapElement['content'];
            return (
                 <div className="aspect-video w-full">
                    <iframe className="w-full h-full" src={embedUrl} title="Google Map" frameBorder="0" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
                </div>
            )
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
    onUpdateNode?: (id: string, updates: Partial<WebsiteNode>) => void;
    onAiTextUpdate?: (nodeId: string, action: string, options?: { tone?: string }) => void;
    isAiLoading?: boolean;
    onContextMenuRequest?: (e: React.MouseEvent, nodeId: string) => void;
}>> = ({ children, node, interactive, isSelected, isHovered, onSelect, onHover, onUpdateNode, onAiTextUpdate, isAiLoading, onContextMenuRequest }) => {
    if (!interactive) {
        return <div data-node-id={node.id}>{children}</div>;
    }

    const handleClick = (e: React.MouseEvent) => {
        if (node.locked) return;
        e.stopPropagation();
        onSelect?.(node.id);
    };

    const handleMouseEnter = (e: React.MouseEvent) => {
        if (node.locked) return;
        e.stopPropagation();
        onHover?.(node.id);
    };

    const handleMouseLeave = (e: React.MouseEvent) => {
        e.stopPropagation();
        onHover?.(null);
    };
    
    const handleContextMenu = (e: React.MouseEvent) => {
        if (!interactive || !onContextMenuRequest) return;
        e.preventDefault();
        e.stopPropagation();
        onContextMenuRequest(e, node.id);
    };


    const wrapperClasses = [
        'interactive-wrapper',
        isSelected ? 'selected' : '',
        isHovered ? 'hovered' : ''
    ].join(' ').trim();
    
    const isAiTextElement = ['headline', 'text', 'button'].includes(node.type);
    const isRichTextElement = ['headline', 'text'].includes(node.type);

    return (
        <div
            className={wrapperClasses}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
            data-node-id={node.id}
        >
            {node.locked && <div className="lock-overlay" />}
            {isSelected && isAiTextElement && onAiTextUpdate && (
                <AiToolbar 
                    node={node} 
                    onAiAction={onAiTextUpdate} 
                    isLoading={isAiLoading} 
                />
            )}
            {isSelected && isRichTextElement && <RichTextToolbar />}
            {children}
        </div>
    );
};

const NodeRenderer: React.FC<Omit<PreviewProps, 'websiteData' | 'activePage'> & { node: WebsiteNode, theme: ThemeConfig, websiteData: WebsiteData, context: 'page' | 'header' | 'footer' }> = (props) => {
    const { node, theme, device = 'desktop' } = props;

    if (!node || !node.id || !node.type) { return null; }
    
    const isVisible = node.visibility?.[device] !== false;
    if (!isVisible && props.interactive) {
         // Show a placeholder for hidden items in the editor
        return (
             <div className="p-2 text-center text-xs text-slate-400 bg-slate-100 border-dashed border">
                Hidden on {device}
            </div>
        )
    }
    if (!isVisible && !props.interactive) return null;


    const isSelected = props.interactive && props.selectedNodeId === node.id;
    const isHovered = props.interactive && props.hoveredNodeId === node.id && !isSelected;
    const mergedStyles = mergeStylesForDevice(node.styles, device);

    const QuickAddButton = () => (
      props.interactive && props.onAddSection && (
        <div className="quick-add-button-wrapper">
          <div className="quick-add-button">
            <button onClick={() => props.onAddSection?.(props.context)}>
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )
    );

    if (!('children' in node) || !Array.isArray(node.children)) {
      return (
        <InteractiveWrapper {...props} node={node} isSelected={isSelected} isHovered={isHovered}>
            <div style={mergedStyles}>
                <ElementRenderer element={node as IElement} theme={theme} websiteData={props.websiteData} interactive={props.interactive} onUpdateNode={props.onUpdateNode} />
            </div>
        </InteractiveWrapper>
      );
    }
  
    let className = '';
    let Tag: React.ElementType = 'div';
    const dataAttributes: Record<string, string> = {};
    
    switch(node.type) {
        case 'section':
            Tag = 'section';
            className = 'w-full';
            if (node.animation && node.animation !== 'none') {
                className += ` gjs-animation-section ${node.animation}`;
                dataAttributes['data-animation'] = node.animation;
            }
            break;
        case 'row':
            className = 'w-full';
            mergedStyles.display = 'flex'; // Rows are always flex
            break;
        case 'column':
            className = 'w-full';
            mergedStyles.display = 'flex'; // Columns are flex containers for elements
            mergedStyles.flexDirection = mergedStyles.flexDirection || 'column'; // Default to column
             if ((node as Column).children.length === 0 && props.interactive) {
                return <div className="p-4 min-h-[50px] w-full" style={mergedStyles}></div>
            }
            break;
    }

    return (
        <InteractiveWrapper {...props} node={node} isSelected={isSelected} isHovered={isHovered}>
            <Tag className={className} style={mergedStyles} {...dataAttributes}>
                {node.children
                    .filter(child => child && child.id)
                    .map(child => (
                        <NodeRenderer key={child.id} {...props} node={child} />
                    ))
                }
            </Tag>
             {node.type === 'section' && <QuickAddButton />}
        </InteractiveWrapper>
    );
};

const Preview: React.FC<PreviewProps> = (props) => {
  const { websiteData, activePage } = props;
  const theme = useMemo(() => themeConfigs[websiteData.theme] || themeConfigs.light, [websiteData.theme]);
  const fontFamilyStyle = websiteData.googleFont ? { fontFamily: `'${websiteData.googleFont}', sans-serif` } : {};


  return (
    <div className={`w-full h-full overflow-y-auto ${theme.bg} ${theme.text} transition-colors duration-300`} style={fontFamilyStyle}>
      
      {websiteData.header.length > 0 &&
        <header className="w-full">
            {websiteData.header.map(section => (
                <NodeRenderer key={section.id} {...props} node={section} theme={theme} context="header" />
            ))}
        </header>
      }

      {/* Hero for the current page */}
      {!props.interactive && (
        <section className="relative h-72">
          <img src={activePage.heroImageUrl} alt={`${activePage.name} hero image`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center p-6">
            <div className="text-center">
              <h2 className="text-4xl font-extrabold text-white">{activePage.name}</h2>
              <p className="mt-2 text-lg text-slate-200">{activePage.tagline}</p>
            </div>
          </div>
        </section>
      )}

      <main>
        {activePage.children && activePage.children.filter(Boolean).map(section => (
            <NodeRenderer key={section.id} {...props} node={section} theme={theme} context="page" />
        ))}
      </main>

      {websiteData.footer.length > 0 &&
        <footer className={`w-full ${theme.footerBg} ${theme.footerText}`}>
            {websiteData.footer.map(section => (
                <NodeRenderer key={section.id} {...props} node={section} theme={theme} context="footer" />
            ))}
        </footer>
      }

      {!websiteData.footer.length &&
        <footer className={`py-6 px-6 text-center ${theme.footerBg} ${theme.footerText}`}>
          <p>&copy; {new Date().getFullYear()} {websiteData.name}. All rights reserved.</p>
        </footer>
      }
    </div>
  );
};

export default React.memo(Preview);