import React, { useState, useEffect } from 'react';
import type { WebsiteNode, Device, StyleProperties, Element, WebsiteData, Row, Column, NavigationElement, NavLink, Page, Theme, FormElement, FormField, VideoElement, IconElement, SocialIconsElement, HeadlineElement, AccordionElement } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PlusIcon, TrashIcon, LinkIcon, UnlinkIcon, ChainLinkIcon, DesktopIcon, TabletIcon, MobileIcon } from './icons';
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
  device: Device; // Preview device
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
            <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-auto">
                {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        ) : (
            <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} {...props}/>
        )}
    </div>
);

const DeviceSwitcher: React.FC<{device: Device, onSetDevice: (d: Device) => void}> = ({device, onSetDevice}) => {
    const deviceOptions: { id: Device; icon: React.FC<any> }[] = [ { id: 'desktop', icon: DesktopIcon }, { id: 'tablet', icon: TabletIcon }, { id: 'mobile', icon: MobileIcon } ];
    return (
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md my-2">
           {deviceOptions.map(({ id, icon: Icon }) => ( <button key={id} onClick={() => onSetDevice(id)} className={`flex-1 p-1 rounded text-xs ${device === id ? 'bg-white shadow' : 'text-slate-500 hover:bg-slate-200'}`} title={`Edit ${id} styles`}> <Icon className="w-4 h-4 mx-auto" /> </button> ))}
        </div>
    )
}

const NavLinkManager: React.FC<{element: NavigationElement, onUpdateNode: (id: string, updates: Partial<WebsiteNode>) => void, pages: Page[]}> = ({ element, onUpdateNode, pages }) => {
    const links = element.content.links || [];
    const handleUpdateLink = (linkId: string, field: keyof NavLink, value: any) => {
        const newLinks = links.map(link => link.id === linkId ? {...link, [field]: value} : link);
        onUpdateNode(element.id, { content: {...element.content, links: newLinks }});
    }
    const handleAddLink = () => {
        const newLink: NavLink = { id: uuidv4(), text: 'New Link', type: 'internal', pageId: pages.find(p=>p.isHomepage)?.id || pages[0]?.id, openInNewTab: false };
        onUpdateNode(element.id, { content: {...element.content, links: [...links, newLink] }});
    }
    const handleRemoveLink = (linkId: string) => {
        onUpdateNode(element.id, { content: {...element.content, links: links.filter(l => l.id !== linkId) }});
    }
    return (
        <div className="space-y-2">
            {links.map(link => (
                <div key={link.id} className="p-2 border rounded-md space-y-2 text-sm bg-slate-50">
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
                        <input type="checkbox" id={`new-tab-${link.id}`} checked={link.openInNewTab} onChange={e => handleUpdateLink(link.id, 'openInNewTab', e.target.checked)} />
                        <label htmlFor={`new-tab-${link.id}`} className="text-xs">Open in new tab</label>
                     </div>
                </div>
            ))}
             <button onClick={handleAddLink} className="text-indigo-600 text-sm font-semibold flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Link</button>
        </div>
    )
}

const FormManager: React.FC<{element: FormElement, onUpdateNode: (id: string, updates: Partial<WebsiteNode>) => void}> = ({ element, onUpdateNode }) => {
    const fields = element.content.fields || [];
    const handleUpdateField = (fieldId: string, prop: keyof FormField, value: any) => {
        const newFields = fields.map(f => f.id === fieldId ? {...f, [prop]: value} : f);
        onUpdateNode(element.id, { content: {...element.content, fields: newFields }});
    }
    const handleAddField = () => {
        const newField: FormField = { id: uuidv4(), label: "New Field", type: 'text', required: false };
        onUpdateNode(element.id, { content: {...element.content, fields: [...fields, newField] }});
    }
    const handleRemoveField = (fieldId: string) => {
        onUpdateNode(element.id, { content: {...element.content, fields: fields.filter(f => f.id !== fieldId) }});
    }
    return (
        <div className="space-y-2">
            <StyleInput label="Button Text" value={element.content.buttonText} onChange={val => onUpdateNode(element.id, { content: {...element.content, buttonText: val}})} />
            <h4 className="text-xs font-bold uppercase text-slate-500 mt-4">Fields</h4>
            {fields.map(field => (
                <div key={field.id} className="p-2 border rounded-md space-y-2 text-sm bg-slate-50">
                    <div className="flex justify-between items-center"><input type="text" value={field.label} onChange={e => handleUpdateField(field.id, 'label', e.target.value)} className="style-input-field flex-grow" /><button onClick={() => handleRemoveField(field.id)} className="p-1 hover:bg-red-50 rounded"><TrashIcon className="w-4 h-4 text-red-500"/></button></div>
                    <select value={field.type} onChange={e => handleUpdateField(field.id, 'type', e.target.value)} className="style-input-field w-full">
                        <option value="text">Text</option><option value="email">Email</option><option value="textarea">Text Area</option><option value="checkbox">Checkbox</option>
                    </select>
                </div>
            ))}
            <button onClick={handleAddField} className="text-indigo-600 text-sm font-semibold flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Field</button>
        </div>
    )
};

const SocialIconsManager: React.FC<{element: SocialIconsElement, onUpdateNode: (id: string, updates: Partial<WebsiteNode>) => void}> = ({ element, onUpdateNode }) => {
    const networks = element.content.networks || [];
    const handleUpdate = (id: string, prop: 'network' | 'url', value: any) => {
        const newNetworks = networks.map(n => n.id === id ? {...n, [prop]: value} : n);
        onUpdateNode(element.id, { content: {...element.content, networks: newNetworks }});
    }
    const handleAdd = () => {
        const newNetwork = { id: uuidv4(), network: 'twitter', url: '' };
        onUpdateNode(element.id, { content: {...element.content, networks: [...networks, newNetwork] }});
    }
    const handleRemove = (id: string) => {
        onUpdateNode(element.id, { content: {...element.content, networks: networks.filter(n => n.id !== id) }});
    }
    return (
        <div className="space-y-2">
            {networks.map(n => (
                <div key={n.id} className="p-2 border rounded-md space-y-2 text-sm bg-slate-50">
                     <div className="flex justify-between items-center"><select value={n.network} onChange={e => handleUpdate(n.id, 'network', e.target.value)} className="style-input-field flex-grow"><option>facebook</option><option>twitter</option><option>instagram</option><option>linkedin</option></select><button onClick={() => handleRemove(n.id)} className="p-1 hover:bg-red-50 rounded"><TrashIcon className="w-4 h-4 text-red-500"/></button></div>
                     <input type="text" value={n.url} onChange={e => handleUpdate(n.id, 'url', e.target.value)} className="style-input-field w-full" placeholder="https://..."/>
                </div>
            ))}
            <button onClick={handleAdd} className="text-indigo-600 text-sm font-semibold flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Network</button>
        </div>
    )
}

const AccordionManager: React.FC<{element: AccordionElement, onUpdateNode: (id: string, updates: Partial<WebsiteNode>) => void}> = ({ element, onUpdateNode }) => {
    const items = element.content.items || [];
    const handleUpdate = (id: string, prop: 'title' | 'content', value: any) => {
        const newItems = items.map(i => i.id === id ? {...i, [prop]: value} : i);
        onUpdateNode(element.id, { content: {...element.content, items: newItems }});
    }
    const handleAdd = () => {
        const newItem = { id: uuidv4(), title: 'New Item', content: 'New content.' };
        onUpdateNode(element.id, { content: {...element.content, items: [...items, newItem] }});
    }
    const handleRemove = (id: string) => {
        onUpdateNode(element.id, { content: {...element.content, items: items.filter(i => i.id !== id) }});
    }
    return (
        <div className="space-y-2">
             {items.map(item => (
                <div key={item.id} className="p-2 border rounded-md space-y-2 text-sm bg-slate-50">
                     <div className="flex justify-between items-center"><input type="text" value={item.title} onChange={e => handleUpdate(item.id, 'title', e.target.value)} className="style-input-field flex-grow" /><button onClick={() => handleRemove(item.id)} className="p-1 hover:bg-red-50 rounded"><TrashIcon className="w-4 h-4 text-red-500"/></button></div>
                     <textarea value={item.content} onChange={e => handleUpdate(item.id, 'content', e.target.value)} className="style-input-field w-full" rows={3}/>
                </div>
             ))}
             <button onClick={handleAdd} className="text-indigo-600 text-sm font-semibold flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Item</button>
        </div>
    )
}


// The main Inspector Panel component
const StylePanel: React.FC<StylePanelProps> = ({ node, nodePath, websiteData, setWebsiteData, activePage, onUpdateNode, onSelectNode, device: previewDevice }) => {
    const [styleDevice, setStyleDevice] = useState<Device>('desktop');

    useEffect(() => {
        setStyleDevice(previewDevice);
    }, [previewDevice])

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
        onUpdateNode(node.id, { styles: { ...node.styles, [styleDevice]: { ...(node.styles[styleDevice] || {}), [prop]: value } } });
    };

    const handleContentChange = (field: string, value: any) => {
        onUpdateNode(node.id, { content: { ...(node as any).content, [field]: value } });
    };

    const currentStyles = node.styles?.[styleDevice] || {};
    const content = (node as any).content || {};
    
    const renderContentFields = () => {
        switch (node.type) {
            case 'headline': return <StyleInput label="Level" value={content.level} onChange={val => handleContentChange('level', val)} type="select" options={['h1','h2','h3','h4','h5','h6'].map(h => ({value:h, label:h.toUpperCase()}))}/>;
            case 'button': return <StyleInput label="Link URL" value={content.href} onChange={val => handleContentChange('href', val)} />;
            case 'image': return <StyleInput label="Image URL" value={content.src} onChange={val => handleContentChange('src', val)} />;
            case 'icon': return <StyleInput label="Icon" value={content.name} onChange={val => handleContentChange('name', val)} type="select" options={Object.keys(availableIcons).map(name => ({value: name, label: name.charAt(0).toUpperCase() + name.slice(1)}))}/>;
            case 'video': return <StyleInput label="Video URL" value={content.src} onChange={val => handleContentChange('src', val)} placeholder="YouTube, Vimeo, or .mp4 URL"/>;
            case 'navigation': return <NavLinkManager element={node as NavigationElement} onUpdateNode={onUpdateNode} pages={websiteData.pages} />;
            case 'form': return <FormManager element={node as FormElement} onUpdateNode={onUpdateNode} />;
            case 'socialIcons': return <SocialIconsManager element={node as SocialIconsElement} onUpdateNode={onUpdateNode} />;
            case 'accordion': return <AccordionManager element={node as AccordionElement} onUpdateNode={onUpdateNode} />;
            default: return <p className="text-xs text-center text-slate-400 p-2">No content settings for this element.</p>;
        }
    };

    const hasContentFields = ['headline', 'button', 'image', 'icon', 'video', 'navigation', 'form', 'socialIcons', 'accordion'].includes(node.type);

    return (
        <aside className="editor-inspector">
            <div className="inspector-header">
                <h3 className="inspector-header-title capitalize">{node.customName || node.type}</h3>
                <div className="inspector-header-path">
                    {nodePath.map((p, i) => (<span key={p.id}><button onClick={() => onSelectNode(p.id)} className="inspector-breadcrumb">{p.customName || p.type}</button>{i < nodePath.length - 1 && ' > '}</span>))}
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto">
                {hasContentFields && <InspectorAccordion title="Content" defaultOpen>{renderContentFields()}</InspectorAccordion>}
                
                <InspectorAccordion title="Layout" defaultOpen>
                    <DeviceSwitcher device={styleDevice} onSetDevice={setStyleDevice} />
                    <StyleInput label="Display" value={currentStyles.display} onChange={val => handleStyleChange('display', val)} type="select" options={[{value: 'flex', label: 'Flex'}, {value: 'grid', label: 'Grid'}, {value: 'block', label: 'Block'}, {value: 'none', label: 'None'}]} />
                    {currentStyles.display === 'flex' && (
                        <>
                         <StyleInput label="Direction" value={currentStyles.flexDirection} onChange={val => handleStyleChange('flexDirection', val)} type="select" options={[{value: 'row', label: 'Row'}, {value: 'column', label: 'Column'}]}/>
                         <StyleInput label="Justify" value={currentStyles.justifyContent} onChange={val => handleStyleChange('justifyContent', val)} type="select" options={['flex-start', 'center', 'flex-end', 'space-between'].map(o => ({value: o, label: o}))}/>
                         <StyleInput label="Align" value={currentStyles.alignItems} onChange={val => handleStyleChange('alignItems', val)} type="select" options={['flex-start', 'center', 'flex-end', 'stretch'].map(o => ({value: o, label: o}))}/>
                         <StyleInput label="Gap" value={currentStyles.gap} onChange={val => handleStyleChange('gap', val)}/>
                        </>
                    )}
                </InspectorAccordion>
                <InspectorAccordion title="Spacing">
                    <DeviceSwitcher device={styleDevice} onSetDevice={setStyleDevice} />
                    <StyleInput label="Margin Top" value={currentStyles.marginTop} onChange={v => handleStyleChange('marginTop', v)}/>
                    <StyleInput label="Margin Bottom" value={currentStyles.marginBottom} onChange={v => handleStyleChange('marginBottom', v)}/>
                    <StyleInput label="Padding Top" value={currentStyles.paddingTop} onChange={v => handleStyleChange('paddingTop', v)}/>
                    <StyleInput label="Padding Bottom" value={currentStyles.paddingBottom} onChange={v => handleStyleChange('paddingBottom', v)}/>
                    <StyleInput label="Padding Left" value={currentStyles.paddingLeft} onChange={v => handleStyleChange('paddingLeft', v)}/>
                    <StyleInput label="Padding Right" value={currentStyles.paddingRight} onChange={v => handleStyleChange('paddingRight', v)}/>
                </InspectorAccordion>
                <InspectorAccordion title="Size">
                    <DeviceSwitcher device={styleDevice} onSetDevice={setStyleDevice} />
                    <StyleInput label="Width" value={currentStyles.width} onChange={v => handleStyleChange('width', v)} />
                    <StyleInput label="Height" value={currentStyles.height} onChange={v => handleStyleChange('height', v)} />
                    <StyleInput label="Min Width" value={currentStyles.minWidth} onChange={v => handleStyleChange('minWidth', v)} />
                    <StyleInput label="Min Height" value={currentStyles.minHeight} onChange={v => handleStyleChange('minHeight', v)} />
                </InspectorAccordion>
                <InspectorAccordion title="Typography">
                    <DeviceSwitcher device={styleDevice} onSetDevice={setStyleDevice} />
                    <StyleInput label="Font Size" value={currentStyles.fontSize} onChange={v => handleStyleChange('fontSize', v)}/>
                    <StyleInput label="Font Weight" value={currentStyles.fontWeight} onChange={v => handleStyleChange('fontWeight', v)} type="select" options={[
                        {value: '300', label: 'Light'}, {value: '400', label: 'Normal'}, {value: '500', label: 'Medium'}, {value: '600', label: 'Semi-Bold'}, {value: '700', label: 'Bold'}
                    ]} />
                    <StyleInput label="Text Align" value={currentStyles.textAlign} onChange={v => handleStyleChange('textAlign', v)} type="select" options={[{value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}, {value: 'right', label: 'Right'}]} />
                    <StyleInput label="Color" type="color" value={currentStyles.color} onChange={v => handleStyleChange('color', v)}/>
                </InspectorAccordion>
                <InspectorAccordion title="Background">
                     <DeviceSwitcher device={styleDevice} onSetDevice={setStyleDevice} />
                     <StyleInput label="Color" type="color" value={currentStyles.backgroundColor} onChange={v => handleStyleChange('backgroundColor', v)}/>
                </InspectorAccordion>
                <InspectorAccordion title="Borders">
                     <DeviceSwitcher device={styleDevice} onSetDevice={setStyleDevice} />
                     <StyleInput label="Radius" value={currentStyles.borderRadius} onChange={v => handleStyleChange('borderRadius', v)}/>
                     <StyleInput label="Width" value={currentStyles.borderWidth} onChange={v => handleStyleChange('borderWidth', v)}/>
                     <StyleInput label="Style" value={currentStyles.borderStyle} onChange={v => handleStyleChange('borderStyle', v)} type="select" options={['solid', 'dashed', 'dotted'].map(s => ({value: s, label: s.charAt(0).toUpperCase() + s.slice(1)}))}/>
                     <StyleInput label="Color" type="color" value={currentStyles.borderColor} onChange={v => handleStyleChange('borderColor', v)}/>
                </InspectorAccordion>
                 <InspectorAccordion title="Position">
                    <DeviceSwitcher device={styleDevice} onSetDevice={setStyleDevice} />
                    <StyleInput label="Position" value={currentStyles.position} onChange={v => handleStyleChange('position', v)} type="select" options={['static', 'relative', 'absolute', 'fixed', 'sticky'].map(s => ({value: s, label: s.charAt(0).toUpperCase() + s.slice(1)}))}/>
                    <StyleInput label="Top" value={currentStyles.top} onChange={v => handleStyleChange('top', v)} />
                    <StyleInput label="Bottom" value={currentStyles.bottom} onChange={v => handleStyleChange('bottom', v)} />
                    <StyleInput label="Left" value={currentStyles.left} onChange={v => handleStyleChange('left', v)} />
                    <StyleInput label="Right" value={currentStyles.right} onChange={v => handleStyleChange('right', v)} />
                    <StyleInput label="Z-Index" type="number" value={currentStyles.zIndex} onChange={v => handleStyleChange('zIndex', v)} />
                </InspectorAccordion>
                <InspectorAccordion title="Effects">
                    <DeviceSwitcher device={styleDevice} onSetDevice={setStyleDevice} />
                    <StyleInput label="Opacity" type="number" min={0} max={1} step={0.1} value={currentStyles.opacity} onChange={v => handleStyleChange('opacity', v)} />
                    <StyleInput label="Box Shadow" value={currentStyles.boxShadow} onChange={v => handleStyleChange('boxShadow', v)} placeholder="e.g. 0 10px 15px #0001" />
                </InspectorAccordion>
            </div>
        </aside>
    );
};
export default StylePanel;