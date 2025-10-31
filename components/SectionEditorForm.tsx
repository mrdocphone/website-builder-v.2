import React, { useState, useEffect } from 'react';
import type { WebsiteNode, Device, StyleProperties, Element, WebsiteData, Row, Column, NavigationElement, NavLink, Page, Theme, FormElement, FormField, VideoElement, IconElement, SocialIconsElement } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PlusIcon, TrashIcon, LinkIcon, UnlinkIcon, ChainLinkIcon } from './icons';
import { availableIcons } from './icons';

interface StylePanelProps {
  node: WebsiteNode | null;
  nodePath: WebsiteNode[];
  websiteData: WebsiteData;
  setWebsiteData: (producer: (draft: WebsiteData) => void | WebsiteData, message: string) => void;
  activePage: Page;
  onUpdateNode: (id: string, updates: Partial<WebsiteNode>) => void;
  onOpenAssetManager: () => void;
  onSelectNode: (id: string) => void;
  device: Device;
}

// Sub-components for the Inspector
const InspectorAccordion: React.FC<React.PropsWithChildren<{title: string, defaultOpen?: boolean}>> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div>
            <button onClick={() => setIsOpen(!isOpen)} className="inspector-accordion-header">
                <span>{title}</span>
                <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </span>
            </button>
            {isOpen && <div className="inspector-accordion-content">{children}</div>}
        </div>
    )
};

const StyleInput: React.FC<{ label: string; value: any; onChange: (value: any) => void; type?: string; options?: { value: string | number, label: string }[]; placeholder?: string; min?: number; max?: number; step?: number; }> = ({ label, value, onChange, type = 'text', options, placeholder, ...props }) => (
    <div className="style-input">
        <label>{label}</label>
        {type === 'select' ? (
            <select value={value || ''} onChange={e => onChange(e.target.value)}>
                {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        ) : (
            <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} {...props}/>
        )}
    </div>
);

const NavLinkManager: React.FC<{element: NavigationElement, onUpdateNode: (id: string, updates: Partial<WebsiteNode>) => void, pages: Page[]}> = ({ element, onUpdateNode, pages }) => {
    const links = element.content.links || [];
    const handleUpdateLink = (linkId: string, field: keyof NavLink, value: any) => {
        const newLinks = links.map(link => link.id === linkId ? {...link, [field]: value} : link);
        onUpdateNode(element.id, { content: {...element.content, links: newLinks }});
    }
    const handleAddLink = () => {
        const newLink: NavLink = { id: uuidv4(), text: 'New Link', type: 'internal', pageId: pages[0]?.id, openInNewTab: false };
        onUpdateNode(element.id, { content: {...element.content, links: [...links, newLink] }});
    }
    const handleRemoveLink = (linkId: string) => {
        onUpdateNode(element.id, { content: {...element.content, links: links.filter(l => l.id !== linkId) }});
    }
    return (
        <div className="space-y-2">
            {links.map(link => (
                <div key={link.id} className="p-2 border rounded-md space-y-2">
                     <div className="flex justify-between items-center">
                        <input type="text" value={link.text} onChange={e => handleUpdateLink(link.id, 'text', e.target.value)} className="style-input-field flex-grow" placeholder="Link Text"/>
                        <button onClick={() => handleRemoveLink(link.id)} className="p-1 hover:bg-red-50 rounded"><TrashIcon className="w-4 h-4 text-red-500"/></button>
                     </div>
                     <select value={link.type} onChange={e => handleUpdateLink(link.id, 'type', e.target.value)} className="style-input-field w-full">
                        <option value="internal">Internal Page</option>
                        <option value="external">External URL</option>
                     </select>
                     {link.type === 'internal' ? (
                         <select value={link.pageId} onChange={e => handleUpdateLink(link.id, 'pageId', e.target.value)} className="style-input-field w-full">
                            {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                         </select>
                     ) : (
                         <input type="text" value={link.href || ''} onChange={e => handleUpdateLink(link.id, 'href', e.target.value)} className="style-input-field w-full" placeholder="https://example.com"/>
                     )}
                     <div className="flex items-center gap-2">
                        <input type="checkbox" checked={link.openInNewTab} onChange={e => handleUpdateLink(link.id, 'openInNewTab', e.target.checked)} />
                        <span className="text-xs">Open in new tab</span>
                     </div>
                </div>
            ))}
             <button onClick={handleAddLink} className="text-indigo-600 text-sm font-semibold flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Link</button>
        </div>
    )
}

// The main Inspector Panel component
const StylePanel: React.FC<StylePanelProps> = ({ node, nodePath, websiteData, setWebsiteData, activePage, onUpdateNode, onSelectNode, device }) => {
    if (!node) {
        // GLOBAL SETTINGS VIEW
        const handleGlobalChange = (field: keyof WebsiteData, value: any) => {
            setWebsiteData(draft => {
                if(draft) (draft as any)[field] = value;
            }, `Update ${field}`);
        }
         const themes: {id: Theme, name: string}[] = [ {id: 'light', name: 'Light'}, {id: 'dark', name: 'Dark'}, {id: 'ocean', name: 'Ocean'}, {id: 'forest', name: 'Forest'}];
        const googleFonts = [ 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro', 'Raleway', 'Poppins', 'Nunito Sans', 'Merriweather' ];

        return (
            <aside className="editor-inspector">
                 <div className="inspector-header">
                    <h3 className="inspector-header-title">Site Settings</h3>
                 </div>
                 <div className="flex-grow">
                    <InspectorAccordion title="Branding & Theme" defaultOpen>
                        <StyleInput label="Site Name" value={websiteData.name} onChange={val => handleGlobalChange('name', val)} />
                        <StyleInput label="Favicon URL" value={websiteData.faviconUrl} onChange={val => handleGlobalChange('faviconUrl', val)} />
                        <StyleInput label="Theme" value={websiteData.theme} onChange={val => handleGlobalChange('theme', val)} type="select" options={themes.map(t => ({ value: t.id, label: t.name }))} />
                    </InspectorAccordion>
                     <InspectorAccordion title="Typography">
                        <StyleInput label="Google Font" value={websiteData.googleFont} onChange={val => handleGlobalChange('googleFont', val)} type="select" options={[{value: '', label: 'Default'}, ...googleFonts.map(f => ({value: f, label: f}))]} />
                     </InspectorAccordion>
                 </div>
            </aside>
        )
    }

    const handleStyleChange = (prop: keyof StyleProperties, value: any) => {
        onUpdateNode(node.id, { styles: { ...node.styles, [device]: { ...(node.styles[device] || {}), [prop]: value } } });
    };

    const handleContentChange = (field: string, value: any) => {
        onUpdateNode(node.id, { content: { ...(node as any).content, [field]: value } });
    };

    const currentStyles = node.styles?.[device] || {};
    const content = (node as any).content || {};
    
    const renderContentFields = () => {
        switch (node.type) {
            case 'headline': return <StyleInput label="Level" value={content.level} onChange={val => handleContentChange('level', val)} type="select" options={['h1','h2','h3','h4','h5','h6'].map(h => ({value:h, label:h.toUpperCase()}))}/>;
            case 'button': return <StyleInput label="Link URL" value={content.href} onChange={val => handleContentChange('href', val)} />;
            case 'image': return <StyleInput label="Image URL" value={content.src} onChange={val => handleContentChange('src', val)} />;
            case 'icon': return <StyleInput label="Icon" value={content.name} onChange={val => handleContentChange('name', val)} type="select" options={Object.keys(availableIcons).map(name => ({value: name, label: name.charAt(0).toUpperCase() + name.slice(1)}))}/>;
            case 'video': return <StyleInput label="Video URL" value={content.src} onChange={val => handleContentChange('src', val)} placeholder="YouTube, Vimeo, or .mp4 URL"/>;
            case 'navigation': return <NavLinkManager element={node as NavigationElement} onUpdateNode={onUpdateNode} pages={websiteData.pages} />;
            default: return <p className="text-xs text-center text-slate-400 p-2">No content settings for this element.</p>;
        }
    };

    const hasContentFields = ['headline', 'button', 'image', 'icon', 'video', 'navigation'].includes(node.type);

    return (
        <aside className="editor-inspector">
            <div className="inspector-header">
                <h3 className="inspector-header-title capitalize">{node.customName || node.type}</h3>
                <div className="inspector-header-path">
                    {nodePath.map((p, i) => (<span key={p.id}><button onClick={() => onSelectNode(p.id)} className="inspector-breadcrumb">{p.customName || p.type}</button>{i < nodePath.length - 1 && ' > '}</span>))}
                </div>
            </div>
            
            <div className="flex-grow">
                {hasContentFields && <InspectorAccordion title="Content" defaultOpen>{renderContentFields()}</InspectorAccordion>}
                
                <InspectorAccordion title="Layout" defaultOpen>
                    <StyleInput label="Display" value={currentStyles.display} onChange={val => handleStyleChange('display', val)} type="select" options={[{value: 'flex', label: 'Flex'}, {value: 'grid', label: 'Grid'}, {value: 'block', label: 'Block'}, {value: 'none', label: 'None'}]} />
                </InspectorAccordion>
                <InspectorAccordion title="Spacing">
                    <StyleInput label="Margin Top" value={currentStyles.marginTop} onChange={v => handleStyleChange('marginTop', v)}/>
                    <StyleInput label="Margin Bottom" value={currentStyles.marginBottom} onChange={v => handleStyleChange('marginBottom', v)}/>
                    <StyleInput label="Padding Top" value={currentStyles.paddingTop} onChange={v => handleStyleChange('paddingTop', v)}/>
                    <StyleInput label="Padding Bottom" value={currentStyles.paddingBottom} onChange={v => handleStyleChange('paddingBottom', v)}/>
                    <StyleInput label="Padding Left" value={currentStyles.paddingLeft} onChange={v => handleStyleChange('paddingLeft', v)}/>
                    <StyleInput label="Padding Right" value={currentStyles.paddingRight} onChange={v => handleStyleChange('paddingRight', v)}/>
                </InspectorAccordion>
                <InspectorAccordion title="Typography">
                    <StyleInput label="Font Size" value={currentStyles.fontSize} onChange={v => handleStyleChange('fontSize', v)}/>
                    <StyleInput label="Font Weight" value={currentStyles.fontWeight} onChange={v => handleStyleChange('fontWeight', v)} type="select" options={[
                        {value: '300', label: 'Light'}, {value: '400', label: 'Normal'}, {value: '500', label: 'Medium'}, {value: '600', label: 'Semi-Bold'}, {value: '700', label: 'Bold'}
                    ]} />
                    <StyleInput label="Text Align" value={currentStyles.textAlign} onChange={v => handleStyleChange('textAlign', v)} type="select" options={[{value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}, {value: 'right', label: 'Right'}]} />
                    <StyleInput label="Color" type="color" value={currentStyles.color} onChange={v => handleStyleChange('color', v)}/>
                </InspectorAccordion>
                <InspectorAccordion title="Background">
                     <StyleInput label="Color" type="color" value={currentStyles.backgroundColor} onChange={v => handleStyleChange('backgroundColor', v)}/>
                </InspectorAccordion>
                <InspectorAccordion title="Borders">
                     <StyleInput label="Radius" value={currentStyles.borderRadius} onChange={v => handleStyleChange('borderRadius', v)}/>
                     <StyleInput label="Width" value={currentStyles.borderWidth} onChange={v => handleStyleChange('borderWidth', v)}/>
                     <StyleInput label="Style" value={currentStyles.borderStyle} onChange={v => handleStyleChange('borderStyle', v)} type="select" options={['solid', 'dashed', 'dotted'].map(s => ({value: s, label: s.charAt(0).toUpperCase() + s.slice(1)}))}/>
                     <StyleInput label="Color" type="color" value={currentStyles.borderColor} onChange={v => handleStyleChange('borderColor', v)}/>
                </InspectorAccordion>
            </div>
        </aside>
    );
};
export default StylePanel;