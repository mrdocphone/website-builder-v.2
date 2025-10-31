import React, { useState, useEffect } from 'react';
import type { WebsiteNode, Device, StyleProperties, Element, WebsiteData, Row, Column, NavigationElement, NavLink, Page, Theme } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { PlusIcon, TrashIcon } from './icons';

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
                <span className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`}>&rarr;</span>
            </button>
            {isOpen && <div className="inspector-accordion-content">{children}</div>}
        </div>
    )
};

const StyleInput: React.FC<{ label: string; value: any; onChange: (value: any) => void; type?: string; options?: { value: string, label: string }[]; placeholder?: string; }> = ({ label, value, onChange, type = 'text', options, placeholder }) => (
    <div className="style-input">
        <label>{label}</label>
        {type === 'select' ? (
            <select value={value || ''} onChange={e => onChange(e.target.value)}>
                {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        ) : (
            <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
        )}
    </div>
);


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

    // ELEMENT STYLE VIEW
    const [editingDevice, setEditingDevice] = useState<Device>(device);
    useEffect(() => { setEditingDevice(device); }, [device]);
    
    const handleStyleChange = (prop: keyof StyleProperties, value: any) => {
        const newStyles = {
            ...(node.styles || { desktop: {}, tablet: {}, mobile: {} }),
            [editingDevice]: {
                ...(node.styles?.[editingDevice] || {}),
                [prop]: value,
            }
        };
        onUpdateNode(node.id, { styles: newStyles });
    };

    const handleContentChange = (field: string, value: any) => {
        onUpdateNode(node.id, { content: { ...(node as any).content, [field]: value } });
    };

    const currentStyles = node.styles?.[editingDevice] || {};
    const content = (node as any).content || {};
    
    const renderContentFields = () => {
        switch (node.type) {
            case 'headline': return <StyleInput label="Level" value={content.level} onChange={val => handleContentChange('level', val)} type="select" options={['h1','h2','h3','h4','h5','h6'].map(h => ({value:h, label:h.toUpperCase()}))}/>;
            case 'button': return <StyleInput label="Link URL" value={content.href} onChange={val => handleContentChange('href', val)} />;
            default: return <p className="text-xs text-center text-slate-400 p-2">No content settings for this element.</p>;
        }
    };

    return (
        <aside className="editor-inspector">
            <div className="inspector-header">
                <h3 className="inspector-header-title capitalize">{node.customName || node.type}</h3>
                <div className="inspector-header-path">
                    {nodePath.map((p, i) => (<span key={p.id}><button onClick={() => onSelectNode(p.id)} className="inspector-breadcrumb">{p.customName || p.type}</button>{i < nodePath.length - 1 && ' > '}</span>))}
                </div>
            </div>
            
            <div className="flex-grow">
                {['headline', 'button'].includes(node.type) && <InspectorAccordion title="Content" defaultOpen>{renderContentFields()}</InspectorAccordion>}
                
                <InspectorAccordion title="Layout" defaultOpen>
                    <StyleInput label="Display" value={currentStyles.display} onChange={val => handleStyleChange('display', val)} type="select" options={[{value: 'flex', label: 'Flex'}, {value: 'grid', label: 'Grid'}, {value: 'block', label: 'Block'}]} />
                </InspectorAccordion>
                <InspectorAccordion title="Spacing">
                    <StyleInput label="Margin Top" value={currentStyles.marginTop} onChange={v => handleStyleChange('marginTop', v)}/>
                    <StyleInput label="Margin Bottom" value={currentStyles.marginBottom} onChange={v => handleStyleChange('marginBottom', v)}/>
                    <StyleInput label="Padding Top" value={currentStyles.paddingTop} onChange={v => handleStyleChange('paddingTop', v)}/>
                    <StyleInput label="Padding Bottom" value={currentStyles.paddingBottom} onChange={v => handleStyleChange('paddingBottom', v)}/>
                </InspectorAccordion>
                <InspectorAccordion title="Typography">
                    <StyleInput label="Font Size" value={currentStyles.fontSize} onChange={v => handleStyleChange('fontSize', v)}/>
                    <StyleInput label="Font Weight" value={currentStyles.fontWeight} onChange={v => handleStyleChange('fontWeight', v)} type="select" options={[{value: 'normal', label: 'Normal'}, {value: 'bold', label: 'Bold'}]} />
                    <StyleInput label="Text Align" value={currentStyles.textAlign} onChange={v => handleStyleChange('textAlign', v)} type="select" options={[{value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}, {value: 'right', label: 'Right'}]} />
                    <StyleInput label="Color" type="color" value={currentStyles.color} onChange={v => handleStyleChange('color', v)}/>
                </InspectorAccordion>
                <InspectorAccordion title="Background">
                    <StyleInput label="Color" type="color" value={currentStyles.backgroundColor} onChange={v => handleStyleChange('backgroundColor', v)}/>
                </InspectorAccordion>
                <InspectorAccordion title="Borders">
                     <StyleInput label="Radius" value={currentStyles.borderRadius} onChange={v => handleStyleChange('borderRadius', v)}/>
                </InspectorAccordion>
            </div>
        </aside>
    );
};
export default StylePanel;