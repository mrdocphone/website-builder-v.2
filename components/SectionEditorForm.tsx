

import React, { useState } from 'react';
import type { WebsiteNode, Device, StyleProperties, Element, IconElement, WebsiteData, FormElement, EmbedElement, GalleryElement } from '../types';
import { availableIcons, IconRenderer, DesktopIcon, TabletIcon, MobileIcon, EyeIcon, EyeSlashIcon } from './icons';

interface StylePanelProps {
  node: WebsiteNode;
  websiteData: WebsiteData;
  onUpdate: (id: string, updates: Partial<WebsiteNode>) => void;
}

const StyleInput: React.FC<{
    label: string;
    value: any;
    onChange: (value: any) => void;
    type?: string;
    options?: { value: string, label: string }[];
    isInherited?: boolean;
}> = ({ label, value, onChange, type = 'text', options, isInherited = false }) => (
    <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-slate-500 block flex items-center">
             {isInherited && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" title="Inherited value"></span>}
            {label}
        </label>
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
    isInherited?: boolean;
}> = ({ label, value, onChange, palette, isInherited }) => (
    <div>
        <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-500 block flex items-center">
                 {isInherited && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" title="Inherited value"></span>}
                 {label}
            </label>
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

const StylePanel: React.FC<StylePanelProps> = ({ node, websiteData, onUpdate }) => {
    const [editingDevice, setEditingDevice] = useState<Device>('desktop');
    const [editState, setEditState] = useState<'normal' | 'hover'>('normal');
    
    const handleStyleChange = (prop: keyof StyleProperties, value: any) => {
        const styleProp = editState === 'normal' ? 'styles' : 'hoverStyles';
        const newStyles = {
            ...(node[styleProp] || {}),
            [editingDevice]: {
                ...(node[styleProp]?.[editingDevice] || {}),
                [prop]: value,
            }
        };
        onUpdate(node.id, { [styleProp]: newStyles } as Partial<WebsiteNode>);
    };

    const handleContentChange = (field: string, value: any) => {
        onUpdate(node.id, { content: { ...(node as any).content, [field]: value } });
    };
    
    const handleAnimationChange = (value: WebsiteNode['animation']) => {
        onUpdate(node.id, { animation: value });
    }
    
    const handleVisibilityChange = (device: Device, isVisible: boolean) => {
        onUpdate(node.id, {
            visibility: {
                ...node.visibility,
                [device]: isVisible
            }
        });
    }

    const getInheritedStyleValue = (prop: keyof StyleProperties) => {
        const styleProp = editState === 'normal' ? node.styles : node.hoverStyles;
        if (editingDevice === 'desktop') {
            return styleProp?.desktop?.[prop];
        }
        if (editingDevice === 'tablet') {
            return styleProp?.tablet?.[prop] ?? styleProp?.desktop?.[prop];
        }
        // mobile
        return styleProp?.mobile?.[prop] ?? styleProp?.tablet?.[prop] ?? styleProp?.desktop?.[prop];
    };

    const isInherited = (prop: keyof StyleProperties) => {
         const styleProp = editState === 'normal' ? node.styles : node.hoverStyles;
        return styleProp?.[editingDevice]?.[prop] === undefined;
    }

    const currentStylesForEditing = new Proxy((editState === 'normal' ? node.styles : node.hoverStyles)?.[editingDevice] || {}, {
        get: (_, prop: keyof StyleProperties) => getInheritedStyleValue(prop)
    });

    const content = (node as any).content || {};
    
    const deviceOptions: { id: Device; icon: React.FC<any> }[] = [ { id: 'desktop', icon: DesktopIcon }, { id: 'tablet', icon: TabletIcon }, { id: 'mobile', icon: MobileIcon }, ];


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
            case 'map': return (<>
                <label className="text-sm text-slate-500 block mb-2">Google Maps Embed URL</label>
                <textarea value={(content as any).embedUrl || ''} onChange={e => handleContentChange('embedUrl', e.target.value)} className="w-full p-2 border rounded text-sm h-24 font-mono" />
            </>);
             case 'gallery': return (
                <div>
                    <label className="text-sm text-slate-500 block mb-2">Images</label>
                    {(content as GalleryElement['content']).images.map((img, index) => (
                        <input key={index} type="text" value={img.src} onChange={e => {
                            const newImages = [...(content as GalleryElement['content']).images];
                            newImages[index].src = e.target.value;
                            handleContentChange('images', newImages);
                        }} className="w-full p-1 border rounded text-sm mb-1"/>
                    ))}
                </div>
             );
            default: return <p className="text-sm text-center text-slate-400 p-4">No content to edit for this element.</p>;
        }
    };

    const isContainer = ['section', 'row', 'column'].includes(node.type);

    return (
        <div>
            <div className="p-4 border-b space-y-3">
                <h3 className="font-bold text-lg capitalize">{node.type}</h3>
                <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-md">
                   {deviceOptions.map(({ id, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setEditingDevice(id)}
                        className={`flex-1 py-1.5 px-2 rounded text-sm flex items-center justify-center gap-2 ${editingDevice === id ? 'bg-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}
                        title={`Edit for ${id}`}
                    >
                        <Icon className="w-5 h-5" />
                    </button>
                    ))}
                </div>
                 <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-md">
                    <button onClick={() => setEditState('normal')} className={`flex-1 py-1 text-sm ${editState === 'normal' ? 'bg-white shadow rounded' : 'text-slate-500'}`}>Normal</button>
                    <button onClick={() => setEditState('hover')} className={`flex-1 py-1 text-sm ${editState === 'hover' ? 'bg-white shadow rounded' : 'text-slate-500'}`}>Hover</button>
                 </div>
            </div>
            
             <div className="space-y-px">
                 <Accordion title="Visibility">
                    <div className="flex justify-around">
                        {deviceOptions.map(({id, icon: Icon}) => (
                           <button key={id} onClick={() => handleVisibilityChange(id, node.visibility?.[id] === false)} className="flex flex-col items-center gap-1">
                                <Icon className={`w-5 h-5 ${node.visibility?.[id] === false ? 'text-slate-300' : 'text-slate-700'}`} />
                                {node.visibility?.[id] === false ? <EyeSlashIcon className="w-4 h-4 text-red-500"/> : <EyeIcon className="w-4 h-4 text-green-500"/>}
                           </button>
                        ))}
                    </div>
                 </Accordion>
                {isContainer &&
                    <Accordion title="Layout">
                        {node.type === 'column' && <StyleInput label="Width (basis)" value={currentStylesForEditing.flexBasis} onChange={val => handleStyleChange('flexBasis', val)} isInherited={isInherited('flexBasis')}/>}
                        <StyleInput label="Direction" value={currentStylesForEditing.flexDirection} onChange={val => handleStyleChange('flexDirection', val)} type="select" options={[{value: 'row', label: 'Row'}, {value: 'column', label: 'Column'}]} isInherited={isInherited('flexDirection')}/>
                        <StyleInput label="Justify" value={currentStylesForEditing.justifyContent} onChange={val => handleStyleChange('justifyContent', val)} type="select" options={[{value: 'flex-start', label: 'Start'}, {value: 'center', label: 'Center'}, {value: 'flex-end', label: 'End'}, {value: 'space-between', label: 'Space Between'}]} isInherited={isInherited('justifyContent')}/>
                        <StyleInput label="Align" value={currentStylesForEditing.alignItems} onChange={val => handleStyleChange('alignItems', val)} type="select" options={[{value: 'flex-start', label: 'Start'}, {value: 'center', label: 'Center'}, {value: 'flex-end', label: 'End'}, {value: 'stretch', label: 'Stretch'}]} isInherited={isInherited('alignItems')}/>
                        <StyleInput label="Gap" value={currentStylesForEditing.gap} onChange={val => handleStyleChange('gap', val)} isInherited={isInherited('gap')}/>
                    </Accordion>
                }
                 <Accordion title="Content">
                    {renderContentFields()}
                </Accordion>
                {node.type === 'section' && (
                    <Accordion title="Animation">
                        <StyleInput 
                            label="Entrance Animation"
                            value={node.animation || 'none'}
                            onChange={handleAnimationChange}
                            type="select"
                            options={[
                                { value: 'none', label: 'None' },
                                { value: 'fadeIn', label: 'Fade In' },
                                { value: 'slideInUp', label: 'Slide In Up' },
                            ]}
                        />
                    </Accordion>
                )}
                <Accordion title="Spacing">
                    <StyleInput label="Margin Top" value={currentStylesForEditing.marginTop} onChange={val => handleStyleChange('marginTop', val)} isInherited={isInherited('marginTop')}/>
                    <StyleInput label="Margin Bottom" value={currentStylesForEditing.marginBottom} onChange={val => handleStyleChange('marginBottom', val)} isInherited={isInherited('marginBottom')}/>
                    <StyleInput label="Padding Top" value={currentStylesForEditing.paddingTop} onChange={val => handleStyleChange('paddingTop', val)} isInherited={isInherited('paddingTop')}/>
                    <StyleInput label="Padding Bottom" value={currentStylesForEditing.paddingBottom} onChange={val => handleStyleChange('paddingBottom', val)} isInherited={isInherited('paddingBottom')}/>
                    <StyleInput label="Padding Left" value={currentStylesForEditing.paddingLeft} onChange={val => handleStyleChange('paddingLeft', val)} isInherited={isInherited('paddingLeft')}/>
                    <StyleInput label="Padding Right" value={currentStylesForEditing.paddingRight} onChange={val => handleStyleChange('paddingRight', val)} isInherited={isInherited('paddingRight')}/>
                </Accordion>
                <Accordion title="Typography">
                    <ColorPicker label="Text Color" value={currentStylesForEditing.color} onChange={val => handleStyleChange('color', val)} palette={websiteData.palette} isInherited={isInherited('color')} />
                    <StyleInput label="Font Size" value={currentStylesForEditing.fontSize} onChange={val => handleStyleChange('fontSize', val)} isInherited={isInherited('fontSize')}/>
                    <StyleInput label="Text Align" value={currentStylesForEditing.textAlign} onChange={val => handleStyleChange('textAlign', val)} type="select" options={[{value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}, {value: 'right', label: 'Right'}]} isInherited={isInherited('textAlign')}/>
                </Accordion>
                <Accordion title="Background">
                    <BackgroundPanel styles={currentStylesForEditing} palette={websiteData.palette} onStyleChange={handleStyleChange} />
                </Accordion>
                <Accordion title="Border">
                    <StyleInput label="Border Radius" value={currentStylesForEditing.borderRadius} onChange={val => handleStyleChange('borderRadius', val)} isInherited={isInherited('borderRadius')}/>
                </Accordion>
                 <Accordion title="Effects">
                    <StyleInput label="Shadow" value={currentStylesForEditing.boxShadow} onChange={val => handleStyleChange('boxShadow', val)} isInherited={isInherited('boxShadow')} />
                    {node.type === 'image' && <StyleInput label="Filter" value={currentStylesForEditing.filter} onChange={val => handleStyleChange('filter', val)} isInherited={isInherited('filter')} />}
                 </Accordion>
                 {node.type === 'image' &&
                    <Accordion title="Dimensions">
                         <StyleInput label="Aspect Ratio" value={currentStylesForEditing.aspectRatio} onChange={val => handleStyleChange('aspectRatio', val)} isInherited={isInherited('aspectRatio')}/>
                         <StyleInput label="Object Fit" value={currentStylesForEditing.objectFit} onChange={val => handleStyleChange('objectFit', val)} type="select" options={[{value: 'cover', label: 'Cover'}, {value: 'contain', label: 'Contain'}]} isInherited={isInherited('objectFit')}/>
                    </Accordion>
                 }
                 {node.type === 'spacer' &&
                    <Accordion title="Dimensions">
                        <StyleInput label="Height" value={currentStylesForEditing.height} onChange={val => handleStyleChange('height', val)} isInherited={isInherited('height')}/>
                    </Accordion>
                 }
             </div>
        </div>
    );
};

export default StylePanel;