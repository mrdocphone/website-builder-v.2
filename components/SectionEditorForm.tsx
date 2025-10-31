import React, { useState } from 'react';
import type { WebsiteNode, Device, StyleProperties, Element, IconElement, WebsiteData, FormElement, EmbedElement } from '../types';
import { availableIcons, IconRenderer } from './icons';

interface StylePanelProps {
  node: WebsiteNode;
  device: Device;
  websiteData: WebsiteData;
  onUpdate: (id: string, updates: Partial<WebsiteNode>) => void;
}

const StyleInput: React.FC<{
    label: string;
    value: any;
    onChange: (value: any) => void;
    type?: string;
    options?: { value: string, label: string }[];
}> = ({ label, value, onChange, type = 'text', options }) => (
    <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-slate-500 block">{label}</label>
        {type === 'select' ? (
            <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-1/2 p-1 border rounded text-sm bg-white">
                {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        ) : (
            <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className={`w-1/2 p-1 border rounded text-sm ${type === 'color' ? 'h-8' : ''}`} />
        )}
    </div>
);

const ColorPicker: React.FC<{
    label: string;
    value: string | undefined;
    onChange: (value: string) => void;
    palette: WebsiteData['palette'];
}> = ({ label, value, onChange, palette }) => (
    <div>
        <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-500 block">{label}</label>
            <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)} className="w-1/2 p-1 h-8 border rounded text-sm" />
        </div>
        <div className="global-color-swatches">
            {Object.values(palette).map((color, i) => (
                <button key={i} onClick={() => onChange(color)} className="global-color-swatch" style={{ backgroundColor: color }} />
            ))}
        </div>
    </div>
);


const Accordion: React.FC<React.PropsWithChildren<{title: string}>> = ({ title, children }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    return (
        <div>
            <button onClick={() => setIsOpen(!isOpen)} className="style-accordion-header">
                {title}
            </button>
            {isOpen && <div className="style-accordion-content">{children}</div>}
        </div>
    )
}

const BackgroundPanel: React.FC<{
    styles: StyleProperties,
    palette: WebsiteData['palette'],
    onStyleChange: (prop: keyof StyleProperties, value: any) => void
}> = ({ styles, palette, onStyleChange }) => {
    const [activeTab, setActiveTab] = useState<'color' | 'gradient' | 'image'>('color');

    const handleGradientChange = (part: 'color1' | 'color2' | 'angle', value: string) => {
        const currentGradient = styles.backgroundImage || 'linear-gradient(90deg, #FFFFFF, #000000)';
        const parts = currentGradient.replace('linear-gradient(', '').replace(')', '').split(', ');
        let [angle, color1, color2] = [parts[0], parts[1], parts[2]];

        if (part === 'angle') angle = `${value}deg`;
        if (part === 'color1') color1 = value;
        if (part === 'color2') color2 = value;

        onStyleChange('backgroundImage', `linear-gradient(${angle}, ${color1}, ${color2})`);
    };

    const getGradientParts = () => {
        if (!styles.backgroundImage?.startsWith('linear-gradient')) {
            return { angle: '90', color1: '#ffffff', color2: '#000000' };
        }
        const parts = styles.backgroundImage.replace('linear-gradient(', '').replace(')', '').split(', ');
        return { angle: parts[0].replace('deg', ''), color1: parts[1], color2: parts[2] };
    }

    return (
        <div>
            <div className="style-tab-bar">
                <button onClick={() => setActiveTab('color')} className={`style-tab ${activeTab === 'color' ? 'active' : ''}`}>Color</button>
                <button onClick={() => setActiveTab('gradient')} className={`style-tab ${activeTab === 'gradient' ? 'active' : ''}`}>Gradient</button>
                <button onClick={() => setActiveTab('image')} className={`style-tab ${activeTab === 'image' ? 'active' : ''}`}>Image</button>
            </div>
            {activeTab === 'color' && <ColorPicker label="Color" value={styles.backgroundColor} onChange={val => onStyleChange('backgroundColor', val)} palette={palette} />}
            {activeTab === 'gradient' && <div>
                <ColorPicker label="Color 1" value={getGradientParts().color1} onChange={val => handleGradientChange('color1', val)} palette={palette} />
                <ColorPicker label="Color 2" value={getGradientParts().color2} onChange={val => handleGradientChange('color2', val)} palette={palette} />
                <StyleInput label="Angle" type="number" value={getGradientParts().angle} onChange={val => handleGradientChange('angle', val)} />
            </div>}
            {activeTab === 'image' && <div>
                <StyleInput label="Image URL" value={(styles.backgroundImage || '').startsWith('url') ? (styles.backgroundImage || '').replace(/url\(['"]?(.*?)['"]?\)/, '$1') : ''} onChange={val => onStyleChange('backgroundImage', `url(${val})`)} />
                 <p className="text-xs text-slate-500 mt-1">Note: Setting an image or gradient will override the background color.</p>
            </div>}
        </div>
    )
}

const StylePanel: React.FC<StylePanelProps> = ({ node, device, websiteData, onUpdate }) => {
    
    const handleStyleChange = (prop: keyof StyleProperties, value: any) => {
        const newStyles = {
            ...node.styles,
            [device]: {
                ...node.styles[device],
                [prop]: value,
            }
        };
        onUpdate(node.id, { styles: newStyles });
    };

    const handleContentChange = (field: string, value: any) => {
        onUpdate(node.id, { content: { ...(node as any).content, [field]: value } });
    };

    const currentStyles = node.styles[device] || {};
    const content = (node as any).content || {};

    const renderContentFields = () => {
        switch (node.type) {
            case 'headline': return (<>
                <StyleInput label="Text" value={content.text || ''} onChange={val => handleContentChange('text', val)} />
                <StyleInput label="Level" value={content.level || 'h2'} onChange={val => handleContentChange('level', val)} type="select" options={[{value: 'h1', label: 'Heading 1'}, {value: 'h2', label: 'Heading 2'}, {value: 'h3', label: 'Heading 3'}]} />
            </>);
            case 'text': return <textarea value={content.text || ''} onChange={e => handleContentChange('text', e.target.value)} className="w-full p-2 border rounded text-sm h-32" />;
            case 'image': return (<>
                <StyleInput label="Image URL" value={content.src || ''} onChange={val => handleContentChange('src', val)} />
                <StyleInput label="Alt Text" value={content.alt || ''} onChange={val => handleContentChange('alt', val)} />
            </>);
            case 'button': return (<>
                <StyleInput label="Button Text" value={content.text || ''} onChange={val => handleContentChange('text', val)} />
                <StyleInput label="Link URL" value={content.href || ''} onChange={val => handleContentChange('href', val)} />
            </>);
            case 'video': return (<>
                <StyleInput label="Video URL" value={content.src || ''} onChange={val => handleContentChange('src', val)} />
                <p className="text-xs text-slate-500 mt-1">Enter a YouTube or Vimeo URL.</p>
            </>);
            case 'icon': return (<>
                <label className="text-sm text-slate-500 block mb-2">Icon</label>
                <div className="grid grid-cols-4 gap-2">
                    {Object.keys(availableIcons).map(iconName => (
                        <button key={iconName} onClick={() => handleContentChange('name', iconName)} className={`p-2 rounded border-2 flex justify-center items-center ${content.name === iconName ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}`}>
                            <IconRenderer iconName={iconName} className="w-6 h-6" />
                        </button>
                    ))}
                </div>
            </>);
            case 'form': return <StyleInput label="Button Text" value={(content as FormElement['content']).buttonText || ''} onChange={val => handleContentChange('buttonText', val)} />;
            case 'embed': return (<>
                <label className="text-sm text-slate-500 block mb-2">HTML Code</label>
                <textarea value={(content as EmbedElement['content']).html || ''} onChange={e => handleContentChange('html', e.target.value)} className="w-full p-2 border rounded text-sm h-40 font-mono" placeholder='<p>Paste your HTML here</p>'/>
            </>);
            default: return <p className="text-sm text-center text-slate-400 p-4">No content to edit for this element.</p>;
        }
    };

    const isContainer = ['section', 'row', 'column'].includes(node.type);

    return (
        <div>
            <div className="p-4 border-b">
                <h3 className="font-bold text-lg capitalize">{node.type}</h3>
                <p className="text-sm text-slate-500">Editing for <span className="font-semibold capitalize">{device}</span> view</p>
            </div>
            
             <div className="space-y-px">
                {isContainer &&
                    <Accordion title="Layout">
                        <StyleInput label="Direction" value={currentStyles.flexDirection} onChange={val => handleStyleChange('flexDirection', val)} type="select" options={[{value: 'row', label: 'Row'}, {value: 'column', label: 'Column'}]} />
                        <StyleInput label="Justify" value={currentStyles.justifyContent} onChange={val => handleStyleChange('justifyContent', val)} type="select" options={[{value: 'flex-start', label: 'Start'}, {value: 'center', label: 'Center'}, {value: 'flex-end', label: 'End'}, {value: 'space-between', label: 'Space Between'}]} />
                        <StyleInput label="Align" value={currentStyles.alignItems} onChange={val => handleStyleChange('alignItems', val)} type="select" options={[{value: 'flex-start', label: 'Start'}, {value: 'center', label: 'Center'}, {value: 'flex-end', label: 'End'}, {value: 'stretch', label: 'Stretch'}]} />
                        <StyleInput label="Gap" value={currentStyles.gap} onChange={val => handleStyleChange('gap', val)} />
                    </Accordion>
                }
                 <Accordion title="Content">
                    {renderContentFields()}
                </Accordion>
                <Accordion title="Spacing">
                    <StyleInput label="Margin Top" value={currentStyles.marginTop} onChange={val => handleStyleChange('marginTop', val)} />
                    <StyleInput label="Margin Bottom" value={currentStyles.marginBottom} onChange={val => handleStyleChange('marginBottom', val)} />
                    <StyleInput label="Padding Top" value={currentStyles.paddingTop} onChange={val => handleStyleChange('paddingTop', val)} />
                    <StyleInput label="Padding Bottom" value={currentStyles.paddingBottom} onChange={val => handleStyleChange('paddingBottom', val)} />
                    <StyleInput label="Padding Left" value={currentStyles.paddingLeft} onChange={val => handleStyleChange('paddingLeft', val)} />
                    <StyleInput label="Padding Right" value={currentStyles.paddingRight} onChange={val => handleStyleChange('paddingRight', val)} />
                </Accordion>
                <Accordion title="Typography">
                    <ColorPicker label="Text Color" value={currentStyles.color} onChange={val => handleStyleChange('color', val)} palette={websiteData.palette} />
                    <StyleInput label="Font Size" value={currentStyles.fontSize} onChange={val => handleStyleChange('fontSize', val)} />
                    <StyleInput label="Text Align" value={currentStyles.textAlign} onChange={val => handleStyleChange('textAlign', val)} type="select" options={[{value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}, {value: 'right', label: 'Right'}]} />
                </Accordion>
                <Accordion title="Background">
                    <BackgroundPanel styles={currentStyles} palette={websiteData.palette} onStyleChange={handleStyleChange} />
                </Accordion>
                <Accordion title="Border">
                    <StyleInput label="Border Radius" value={currentStyles.borderRadius} onChange={val => handleStyleChange('borderRadius', val)} />
                </Accordion>
                 {node.type === 'spacer' &&
                    <Accordion title="Dimensions">
                        <StyleInput label="Height" value={currentStyles.height} onChange={val => handleStyleChange('height', val)} />
                    </Accordion>
                 }
             </div>
        </div>
    );
};

export default StylePanel;