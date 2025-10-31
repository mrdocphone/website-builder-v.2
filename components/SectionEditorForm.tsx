
import React, { useState } from 'react';
import type { WebsiteNode, Device, StyleProperties, Element, IconElement, WebsiteData, FormElement, EmbedElement, GalleryElement, SocialIconsElement, FormField, VideoElement } from '../types';
// FIX: Import LayoutIcon to be used in the Layout accordion.
import { availableIcons, IconRenderer, DesktopIcon, TabletIcon, MobileIcon, EyeIcon, EyeSlashIcon, PlusIcon, TrashIcon, DragHandleIcon, PencilIcon, GridIcon, AnimationIcon, CheckboxIcon, SelectIcon, TextColorIcon, LayoutIcon } from './icons';
import { v4 as uuidv4 } from 'uuid';

interface StylePanelProps {
  node: WebsiteNode;
  nodePath: WebsiteNode[];
  websiteData: WebsiteData;
  onUpdate: (id: string, updates: Partial<WebsiteNode>) => void;
  onOpenAssetManager: () => void;
  onSelectNode: (id: string) => void;
}

const StyleInput: React.FC<{
    label: string;
    value: any;
    onChange: (value: any) => void;
    type?: string;
    options?: { value: string, label: string }[];
    isInherited?: boolean;
    placeholder?: string;
}> = ({ label, value, onChange, type = 'text', options, isInherited = false, placeholder }) => (
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
            <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`w-1/2 p-1 border rounded text-sm ${type === 'color' ? 'h-8' : ''}`} />
        )}
    </div>
);

const ColorPicker: React.FC<{
    label: string;
    value: string | undefined;
    onChange: (value: string) => void;
    globalColors: WebsiteData['globalStyles']['colors'];
    isInherited?: boolean;
}> = ({ label, value, onChange, globalColors, isInherited }) => {
    const isGlobal = value?.startsWith('var(--');
    const colorId = isGlobal ? value.match(/--global-color-(.*?)\)/)?.[1] : null;

    const handleColorChange = (newVal: string) => {
        const linkedGlobalColor = globalColors.find(c => c.value === newVal);
        if (linkedGlobalColor) {
            onChange(`var(--global-color-${linkedGlobalColor.id})`);
        } else {
            onChange(newVal);
        }
    }
    
    // For the color input, we need to resolve the CSS variable to a hex code to display it.
    const displayValue = isGlobal && colorId ? globalColors.find(c => c.id === colorId)?.value : value;

    return (
    <div>
        <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-slate-500 block flex items-center">
                 {isInherited && <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2" title="Inherited value"></span>}
                 {label}
            </label>
            <input type="color" value={displayValue || '#000000'} onChange={e => handleColorChange(e.target.value)} className="w-1/2 p-1 h-8 border rounded text-sm" />
        </div>
        <div className="global-color-swatches">
            {globalColors.map(color => (
                <button key={color.id} onClick={() => onChange(`var(--global-color-${color.id})`)} className={`global-color-swatch ${colorId === color.id ? 'selected' : ''}`} style={{ backgroundColor: color.value }} title={color.name} />
            ))}
        </div>
    </div>
    )
};


const Accordion: React.FC<React.PropsWithChildren<{title: string, icon?: React.FC<any>}>> = ({ title, icon: Icon, children }) => {
    const [isOpen, setIsOpen] = React.useState(true);
    return (
        <div className="border-b border-slate-200">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full text-left p-3 flex items-center justify-between hover:bg-slate-50 font-semibold text-sm">
                <span className="flex items-center gap-2">{Icon && <Icon className="w-4 h-4 text-slate-500" />} {title}</span>
                <span>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <div className="p-4 bg-white">{children}</div>}
        </div>
    )
}

const StylePanel: React.FC<StylePanelProps> = ({ node, nodePath, websiteData, onUpdate, onOpenAssetManager, onSelectNode }) => {
    const [editingDevice, setEditingDevice] = useState<Device>('desktop');
    const [editState, setEditState] = useState<'normal' | 'hover'>('normal');
    
    const handleStyleChange = (prop: keyof StyleProperties, value: any) => {
        const styleProp = editState === 'normal' ? 'styles' : 'hoverStyles';
        const newStyles = {
            ...(node[styleProp] || { desktop: {}, tablet: {}, mobile: {} }),
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
        if (!styleProp) return true;
        return styleProp[editingDevice]?.[prop] === undefined;
    }

    const currentStylesForEditing = new Proxy((editState === 'normal' ? node.styles : node.hoverStyles)?.[editingDevice] || {}, {
        get: (_, prop: keyof StyleProperties) => getInheritedStyleValue(prop)
    });

    const content = (node as any).content || {};
    const deviceOptions: { id: Device; icon: React.FC<any> }[] = [ { id: 'desktop', icon: DesktopIcon }, { id: 'tablet', icon: TabletIcon }, { id: 'mobile', icon: MobileIcon }, ];

    const renderContentFields = () => {
        switch (node.type) {
            case 'headline': return (<>
                <StyleInput label="Level" value={content.level || 'h2'} onChange={val => handleContentChange('level', val)} type="select" options={[{value: 'h1', label: 'Heading 1'}, {value: 'h2', label: 'Heading 2'}, {value: 'h3', label: 'Heading 3'}, {value: 'h4', label: 'H4'}, {value: 'h5', label: 'H5'}, {value: 'h6', label: 'H6'}]} />
            </>);
            case 'image': return (<>
                 <button onClick={onOpenAssetManager} className="w-full p-2 border rounded text-sm mb-2">Choose Image</button>
                <StyleInput label="Alt Text" value={content.alt || ''} onChange={val => handleContentChange('alt', val)} />
            </>);
            case 'button': return (<>
                <StyleInput label="Link URL" value={content.href || ''} onChange={val => handleContentChange('href', val)} />
            </>);
            case 'video': return (<>
                <StyleInput label="Video URL" value={content.src || ''} onChange={val => handleContentChange('src', val)} />
                <p className="text-xs text-slate-500 my-2">Enter a YouTube or Vimeo URL.</p>
                <div className="space-y-1 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!content.autoplay} onChange={e => handleContentChange('autoplay', e.target.checked)} /> Autoplay</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!content.loop} onChange={e => handleContentChange('loop', e.target.checked)} /> Loop</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!content.muted} onChange={e => handleContentChange('muted', e.target.checked)} /> Muted</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={!!content.controls} onChange={e => handleContentChange('controls', e.target.checked)} /> Show Controls</label>
                </div>
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
            case 'form': {
                 const fields = (content as FormElement['content']).fields || [];
                 const handleFieldChange = (index: number, field: keyof FormField, value: any) => {
                     const newFields = [...fields];
                     newFields[index] = { ...newFields[index], [field]: value };
                     handleContentChange('fields', newFields);
                 }
                 const addField = () => {
                     const newFields = [...fields, { id: uuidv4(), type: 'text', label: 'New Field', required: false }];
                     handleContentChange('fields', newFields);
                 }
                 const removeField = (index: number) => {
                     const newFields = fields.filter((_, i) => i !== index);
                     handleContentChange('fields', newFields);
                 }
                return (<div>
                    <StyleInput label="Button Text" value={(content as FormElement['content']).buttonText || ''} onChange={val => handleContentChange('buttonText', val)} />
                    <h4 className="font-semibold mt-4 mb-2 text-sm">Form Fields</h4>
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-2 border rounded mb-2 space-y-2">
                             <input value={field.label} onChange={e => handleFieldChange(index, 'label', e.target.value)} className="w-full p-1 border rounded text-sm" placeholder="Field Label"/>
                             <div className="flex gap-2">
                                <select value={field.type} onChange={e => handleFieldChange(index, 'type', e.target.value)} className="p-1 border rounded text-sm">
                                    <option value="text">Text</option><option value="email">Email</option><option value="textarea">Textarea</option><option value="checkbox">Checkbox</option><option value="select">Select</option>
                                </select>
                                <button onClick={() => removeField(index)} className="p-1.5 hover:bg-red-50 rounded"><TrashIcon className="w-4 h-4 text-red-500"/></button>
                             </div>
                        </div>
                    ))}
                    <button onClick={addField} className="text-indigo-600 text-sm font-semibold flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Field</button>
                </div>)
            };
            default: return <p className="text-sm text-center text-slate-400 p-4">No content to edit for this element.</p>;
        }
    };

    const isContainer = ['section', 'row', 'column'].includes(node.type);
    const isGridContainer = currentStylesForEditing.display === 'grid';
    const isTextNode = ['headline', 'text', 'button'].includes(node.type);
    const parentNode = nodePath.length > 1 ? nodePath[nodePath.length - 2] : null;
    const parentStyles = parentNode ? parentNode.styles?.[editingDevice] : null;
    const isInGrid = parentStyles?.display === 'grid';


    return (
        <div className="bg-slate-50">
            <div className="style-panel-breadcrumbs">
                {nodePath.map((p, i) => (
                    <span key={p.id}>
                        <button onClick={() => onSelectNode(p.id)} className="style-panel-breadcrumb">{p.customName || p.type}</button>
                        {i < nodePath.length - 1 && ' > '}
                    </span>
                ))}
            </div>
            <div className="p-4 border-b border-slate-200 space-y-3">
                <h3 className="font-bold text-lg capitalize">{node.customName || node.type}</h3>
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
                           <button key={id} onClick={() => handleVisibilityChange(id, node.visibility?.[id] === false)} className="flex flex-col items-center gap-1 text-slate-600">
                                <Icon className={`w-5 h-5 ${node.visibility?.[id] === false ? 'text-slate-300' : 'text-slate-700'}`} />
                                {node.visibility?.[id] === false ? <EyeSlashIcon className="w-4 h-4 text-red-500"/> : <EyeIcon className="w-4 h-4 text-green-500"/>}
                           </button>
                        ))}
                    </div>
                 </Accordion>
                {isContainer &&
                    <Accordion title="Layout" icon={LayoutIcon}>
                        <StyleInput label="Display" value={currentStylesForEditing.display} onChange={val => handleStyleChange('display', val)} type="select" options={[{value: 'flex', label: 'Flex'}, {value: 'grid', label: 'Grid'}, {value: 'block', label: 'Block'}]} isInherited={isInherited('display')}/>
                        {currentStylesForEditing.display === 'flex' && <>
                            <StyleInput label="Direction" value={currentStylesForEditing.flexDirection} onChange={val => handleStyleChange('flexDirection', val)} type="select" options={[{value: 'row', label: 'Row'}, {value: 'column', label: 'Column'}]} isInherited={isInherited('flexDirection')}/>
                            <StyleInput label="Justify" value={currentStylesForEditing.justifyContent} onChange={val => handleStyleChange('justifyContent', val)} type="select" options={[{value: 'flex-start', label: 'Start'}, {value: 'center', label: 'Center'}, {value: 'flex-end', label: 'End'}, {value: 'space-between', label: 'Space Between'}]} isInherited={isInherited('justifyContent')}/>
                            <StyleInput label="Align" value={currentStylesForEditing.alignItems} onChange={val => handleStyleChange('alignItems', val)} type="select" options={[{value: 'flex-start', label: 'Start'}, {value: 'center', label: 'Center'}, {value: 'flex-end', label: 'End'}, {value: 'stretch', label: 'Stretch'}]} isInherited={isInherited('alignItems')}/>
                        </>}
                        <StyleInput label="Gap" value={currentStylesForEditing.gap} onChange={val => handleStyleChange('gap', val)} isInherited={isInherited('gap')}/>
                    </Accordion>
                }
                 {isGridContainer && <Accordion title="Grid Container" icon={GridIcon}>
                    <StyleInput label="Columns" value={currentStylesForEditing.gridTemplateColumns} onChange={val => handleStyleChange('gridTemplateColumns', val)} placeholder="e.g. 1fr 1fr" />
                    <StyleInput label="Rows" value={currentStylesForEditing.gridTemplateRows} onChange={val => handleStyleChange('gridTemplateRows', val)} placeholder="e.g. auto 1fr" />
                 </Accordion>}
                  {isInGrid && <Accordion title="Grid Item" icon={GridIcon}>
                    <StyleInput label="Col Start" value={currentStylesForEditing.gridColumnStart} onChange={val => handleStyleChange('gridColumnStart', val)} />
                    <StyleInput label="Col End" value={currentStylesForEditing.gridColumnEnd} onChange={val => handleStyleChange('gridColumnEnd', val)} />
                    <StyleInput label="Row Start" value={currentStylesForEditing.gridRowStart} onChange={val => handleStyleChange('gridRowStart', val)} />
                    <StyleInput label="Row End" value={currentStylesForEditing.gridRowEnd} onChange={val => handleStyleChange('gridRowEnd', val)} />
                 </Accordion>}
                 {isTextNode && <Accordion title="Typography" icon={PencilIcon}>
                     <ColorPicker label="Color" value={currentStylesForEditing.color} onChange={v => handleStyleChange('color', v)} globalColors={websiteData.globalStyles.colors} isInherited={isInherited('color')}/>
                     <StyleInput label="Font Size" value={currentStylesForEditing.fontSize} onChange={val => handleStyleChange('fontSize', val)} isInherited={isInherited('fontSize')}/>
                     <StyleInput label="Font Weight" value={currentStylesForEditing.fontWeight} onChange={val => handleStyleChange('fontWeight', val)} type="select" options={[{value: '400', label: 'Normal'}, {value: '700', label: 'Bold'}]} isInherited={isInherited('fontWeight')}/>
                     <StyleInput label="Align" value={currentStylesForEditing.textAlign} onChange={val => handleStyleChange('textAlign', val)} type="select" options={[{value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}, {value: 'right', label: 'Right'}]} isInherited={isInherited('textAlign')}/>
                 </Accordion>}
                 <Accordion title="Content">
                    {renderContentFields()}
                </Accordion>
                 <Accordion title="Animation" icon={AnimationIcon}>
                    <StyleInput label="Triggered Animation" value={node.animation} onChange={handleAnimationChange} type="select" options={[
                        {value: 'none', label: 'None'}, {value: 'fadeIn', label: 'Fade In'}, {value: 'slideInUp', label: 'Slide In Up'}, {value: 'slideInLeft', label: 'Slide In Left'}, {value: 'slideInRight', label: 'Slide In Right'}, {value: 'scaleUp', label: 'Scale Up'}
                    ]} />
                 </Accordion>
             </div>
        </div>
    );
};
export default StylePanel;
