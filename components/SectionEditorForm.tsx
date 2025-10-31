
import React, { useState, useRef } from 'react';
import type { WebsiteNode, Device, StyleProperties, Element, IconElement, WebsiteData, FormElement, EmbedElement, GalleryElement, SocialIconsElement, FormField, VideoElement, AccordionElement, TabsElement, Row, Column } from '../types';
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

const ColorPicker: React.FC<{ label: string, value: string | undefined, onChange: (value: string) => void, globalColors: WebsiteData['globalStyles']['colors'] }> = ({ label, value, onChange, globalColors }) => {
    const varName = value?.match(/var\(--(.*?)\)/)?.[1];
    const isGlobal = !!varName;
    const globalColor = globalColors.find(c => c.name.toLowerCase().replace(/\s+/g, '-') === varName);
    
    return (
        <div className="mb-2">
            <div className="flex items-center justify-between">
                <label className="text-sm text-slate-500 block">{label}</label>
                <div className="flex items-center gap-2 border rounded-md p-1">
                    <input type="color" value={isGlobal ? globalColor?.value : value || '#000000'} onChange={e => onChange(e.target.value)} className="w-6 h-6 p-0 border-none bg-transparent" />
                    <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} className="w-24 border-none text-sm p-0 focus:ring-0" placeholder="#000000"/>
                </div>
            </div>
            {globalColors.length > 0 && <div className="global-color-swatches">
                {globalColors.map(color => (
                    <div key={color.id}
                        onClick={() => onChange(`var(--${color.name.toLowerCase().replace(/\s+/g, '-')})`)}
                        className={`global-color-swatch ${isGlobal && globalColor?.id === color.id ? 'selected' : ''}`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                    />
                ))}
            </div>}
        </div>
    );
};

const BackgroundPicker: React.FC<{
    value: StyleProperties,
    onChange: (prop: keyof StyleProperties, value: string) => void,
    globalColors: WebsiteData['globalStyles']['colors'],
    onOpenAssetManager: () => void,
}> = ({ value, onChange, globalColors, onOpenAssetManager }) => {
    const [type, setType] = useState<'color' | 'image'>(value.backgroundImage ? 'image' : 'color');
    const color = value.backgroundColor || '';
    const image = value.backgroundImage || '';

    const handleColorChange = (newColor: string) => {
        onChange('backgroundColor', newColor);
        onChange('backgroundImage', '');
    };
    
    const handleImageClick = () => {
        onOpenAssetManager();
    }

    return (
        <div className="background-picker">
            <div className="background-picker-tabs">
                <button onClick={() => setType('color')} className={`background-picker-tab ${type === 'color' ? 'active' : ''}`}>Color</button>
                <button onClick={() => setType('image')} className={`background-picker-tab ${type === 'image' ? 'active' : ''}`}>Image</button>
            </div>
            <div className="p-4">
                {type === 'color' ? (
                    <ColorPicker label="Background Color" value={color} onChange={handleColorChange} globalColors={globalColors} />
                ) : (
                    <div>
                        <button onClick={handleImageClick} className="w-full p-2 border rounded text-sm mb-2">Choose Image</button>
                        {image && <div className="text-xs text-slate-500 truncate">Current: {image}</div>}
                    </div>
                )}
            </div>
        </div>
    )
}


const StyleInput: React.FC<{
    label: string;
    value: any;
    onChange: (value: any) => void;
    type?: string;
    options?: { value: string, label: string }[];
    isInherited?: boolean;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
}> = ({ label, value, onChange, type = 'text', options, isInherited = false, placeholder, ...props }) => (
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
            <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`w-1/2 p-1 border rounded text-sm ${type === 'color' ? 'h-8' : ''}`} {...props} />
        )}
    </div>
);

const FourSidedControl: React.FC<{ label: string, values: Record<string, string|undefined>, onChange: (side: string, value: string) => void }> = ({ label, values, onChange }) => (
    <div>
        <label className="text-sm text-slate-500 block mb-1">{label}</label>
        <div className="four-sided-control">
            <input type="text" value={values.Top || ''} onChange={e => onChange('Top', e.target.value)} placeholder="Top" />
            <span></span>
            <input type="text" value={values.Bottom || ''} onChange={e => onChange('Bottom', e.target.value)} placeholder="Bottom" />
        </div>
        <div className="four-sided-control my-1">
            <input type="text" value={values.Left || ''} onChange={e => onChange('Left', e.target.value)} placeholder="Left" />
            <span className="text-xs text-center text-slate-400">{label.charAt(0)}</span>
            <input type="text" value={values.Right || ''} onChange={e => onChange('Right', e.target.value)} placeholder="Right" />
        </div>
    </div>
);


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
    
    const draggedField = useRef<number | null>(null);
    const [dragOverField, setDragOverField] = useState<number | null>(null);
    
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

    const handleLayoutChange = (layout: number[]) => {
        const row = node as Row;
        const oldColumns = row.children;
        const newColumnCount = layout.length;
        const oldColumnCount = oldColumns.length;

        const newColumns: Column[] = layout.map((flexValue, i) => {
            const existingCol = oldColumns[i];
            const basis = `${(flexValue / layout.reduce((a, b) => a + b, 0)) * 100}%`;
            if (existingCol) {
                const newStyles = { ...existingCol.styles };
                if (!newStyles.desktop) newStyles.desktop = {};
                newStyles.desktop.flexBasis = basis;
                return { ...existingCol, styles: newStyles };
            }
            return { id: uuidv4(), type: 'column', styles: { desktop: { flexBasis: basis }, tablet: {}, mobile: {} }, children: [] };
        });

        // If reducing column count, move children from removed columns to the last new column
        if (newColumnCount < oldColumnCount) {
            const childrenToMove = oldColumns.slice(newColumnCount).flatMap(col => col.children);
            newColumns[newColumns.length - 1].children.push(...childrenToMove);
        }

        onUpdate(node.id, { children: newColumns });
    };

    const currentStylesForEditing = (editState === 'normal' ? node.styles : node.hoverStyles)?.[editingDevice] || {};
    const content = (node as any).content || {};
    const deviceOptions: { id: Device; icon: React.FC<any> }[] = [ { id: 'desktop', icon: DesktopIcon }, { id: 'tablet', icon: TabletIcon }, { id: 'mobile', icon: MobileIcon }, ];
    const isContainer = ['section', 'row', 'column'].includes(node.type);
    
    const layouts = [[1], [1, 1], [1, 2], [2, 1], [1, 1, 1], [1, 1, 2]];

    const renderContentFields = () => {
        switch (node.type) {
            case 'headline': return (<StyleInput label="Level" value={content.level || 'h2'} onChange={val => handleContentChange('level', val)} type="select" options={[{value: 'h1', label: 'H1'}, {value: 'h2', label: 'H2'}, {value: 'h3', label: 'H3'}, {value: 'h4', label: 'H4'}, {value: 'h5', label: 'H5'}, {value: 'h6', label: 'H6'}]} />);
            case 'image': return (<>
                 <button onClick={onOpenAssetManager} className="w-full p-2 border rounded text-sm mb-2">Choose Image</button>
                <StyleInput label="Alt Text" value={content.alt || ''} onChange={val => handleContentChange('alt', val)} />
            </>);
            case 'button': return (<StyleInput label="Link URL" value={content.href || ''} onChange={val => handleContentChange('href', val)} />);
            case 'video': return (<>
                <StyleInput label="Video URL" value={content.src || ''} onChange={val => handleContentChange('src', val)} />
                <div className="space-y-1 text-sm mt-2"><label className="flex items-center gap-2"><input type="checkbox" checked={!!content.autoplay} onChange={e => handleContentChange('autoplay', e.target.checked)} /> Autoplay</label></div>
            </>);
            case 'icon': {
                const isIconValid = content.name && availableIcons[content.name];
                return (<>
                    {!isIconValid && <p className="text-sm text-red-600 mb-2">Warning: Saved icon not found. Please select a new one.</p>}
                    <div className="grid grid-cols-4 gap-2">{Object.keys(availableIcons).map(iconName => (<button key={iconName} onClick={() => handleContentChange('name', iconName)} className={`p-2 rounded border-2 flex justify-center items-center ${content.name === iconName ? 'border-indigo-500 bg-indigo-50' : ''}`}><IconRenderer iconName={iconName} className="w-6 h-6" /></button>))}</div>
                </>);
            }
            case 'accordion': {
                const items = (node as AccordionElement).content.items || [];
                return (
                    <div>
                        {items.map((item, index) => <div key={item.id} className="p-2 border rounded mb-2"><input value={item.title} onChange={e => handleContentChange('items', items.map((it, i) => i === index ? {...it, title: e.target.value} : it))} className="w-full p-1 border rounded text-sm mb-1" placeholder="Title"/><textarea value={item.content} onChange={e => handleContentChange('items', items.map((it, i) => i === index ? {...it, content: e.target.value} : it))} className="w-full p-1 border rounded text-sm" placeholder="Content"/></div>)}
                        <button onClick={() => handleContentChange('items', [...items, {id: uuidv4(), title: 'New Item', content: 'New content'}])} className="text-indigo-600 text-sm font-semibold flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Item</button>
                    </div>
                )
            }
            case 'tabs': {
                 const items = (node as TabsElement).content.items || [];
                 return (
                    <div>
                        {items.map((item, index) => <div key={item.id} className="p-2 border rounded mb-2"><input value={item.title} onChange={e => handleContentChange('items', items.map((it, i) => i === index ? {...it, title: e.target.value} : it))} className="w-full p-1 border rounded text-sm mb-1" placeholder="Tab Title"/></div>)}
                        <button onClick={() => handleContentChange('items', [...items, {id: uuidv4(), title: 'New Tab', content: []}])} className="text-indigo-600 text-sm font-semibold flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Tab</button>
                    </div>
                )
            }
            case 'form': {
                const fields = (node as FormElement).content.fields || [];
                const handleFieldChange = (index: number, fieldUpdate: Partial<FormField>) => handleContentChange('fields', fields.map((f, i) => i === index ? { ...f, ...fieldUpdate } : f));
                const handleRemoveField = (index: number) => handleContentChange('fields', fields.filter((_, i) => i !== index));
                const handleDragStart = (e: React.DragEvent, index: number) => { draggedField.current = index; e.dataTransfer.effectAllowed = 'move'; };
                const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); if (draggedField.current !== index) setDragOverField(index); };
                const handleDrop = () => { if (draggedField.current !== null && dragOverField !== null) { const newFields = [...fields]; const [draggedItem] = newFields.splice(draggedField.current, 1); newFields.splice(dragOverField, 0, draggedItem); handleContentChange('fields', newFields); } draggedField.current = null; setDragOverField(null); };

                 return (<div>
                     <StyleInput label="Button Text" value={content.buttonText || 'Submit'} onChange={val => handleContentChange('buttonText', val)} />
                     <hr className="my-4"/>
                     <h4 className="font-semibold text-sm mb-2">Form Fields</h4>
                    <div onDrop={handleDrop} onDragLeave={() => setDragOverField(null)}>
                    {fields.map((field, index) => (
                        <div key={field.id} draggable onDragStart={e => handleDragStart(e, index)} onDragOver={e => handleDragOver(e, index)} className={`p-3 border rounded mb-2 bg-white space-y-2 relative ${draggedField.current === index ? 'opacity-50' : ''}`}>
                            {dragOverField === index && <div className="absolute inset-x-0 top-0 h-1 bg-indigo-400"></div>}
                            <div className="flex justify-between items-center"><span className="font-medium text-sm">Field {index + 1}</span><button onClick={() => handleRemoveField(index)} className="p-1 hover:bg-red-50 rounded"><TrashIcon className="w-4 h-4 text-red-500"/></button></div>
                            <StyleInput label="Type" value={field.type} onChange={val => handleFieldChange(index, { type: val })} type="select" options={[{value:'text',label:'Text'},{value:'email',label:'Email'},{value:'textarea',label:'Text Area'},{value:'checkbox',label:'Checkbox'},{value:'select',label:'Select'}]}/>
                            <StyleInput label="Label" value={field.label} onChange={val => handleFieldChange(index, { label: val })} /><StyleInput label="Placeholder" value={field.placeholder} onChange={val => handleFieldChange(index, { placeholder: val })} />
                            {field.type === 'select' && ( <div> <label className="text-sm text-slate-500 block mb-1">Options</label> <input type="text" value={field.options?.join(', ') || ''} onChange={e => handleFieldChange(index, { options: e.target.value.split(',').map(s => s.trim())})} placeholder="Option 1, Option 2" className="w-full p-1 border rounded text-sm"/> </div> )}
                             <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={!!field.required} onChange={e => handleFieldChange(index, { required: e.target.checked })} /> Required</label>
                        </div>
                    ))}
                    </div>
                    <button onClick={() => handleContentChange('fields', [...fields, {id: uuidv4(), type: 'text', label: 'New Field'}])} className="mt-2 text-indigo-600 text-sm font-semibold flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Field</button>
                 </div>)
            }
            default: return <p className="text-sm text-center text-slate-400 p-4">No content to edit.</p>;
        }
    };

    return (
        <div className="bg-slate-50">
             <div className="style-panel-breadcrumbs">{nodePath.map((p, i) => (<span key={p.id}><button onClick={() => onSelectNode(p.id)} className="style-panel-breadcrumb">{p.customName || p.type}</button>{i < nodePath.length - 1 && ' > '}</span>))}</div>
            <div className="p-4 border-b border-slate-200 space-y-3">
                <h3 className="font-bold text-lg capitalize">{node.customName || node.type}</h3>
                <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-md">{deviceOptions.map(({ id, icon: Icon }) => (<button key={id} onClick={() => setEditingDevice(id)} className={`flex-1 py-1.5 px-2 rounded text-sm flex items-center justify-center gap-2 ${editingDevice === id ? 'bg-white shadow' : ''}`}><Icon className="w-5 h-5" /></button>))}</div>
                 <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-md">
                    <button onClick={() => setEditState('normal')} className={`flex-1 py-1 text-sm ${editState === 'normal' ? 'bg-white shadow rounded' : ''}`}>Normal</button>
                    <button onClick={() => setEditState('hover')} className={`flex-1 py-1 text-sm ${editState === 'hover' ? 'bg-white shadow rounded' : ''}`}>Hover</button>
                 </div>
            </div>
            
             <div className="space-y-px">
                {node.type !== 'row' && <Accordion title="Content">{renderContentFields()}</Accordion>}
                {node.type === 'row' && <Accordion title="Layout" icon={LayoutIcon}>
                    <div className="layout-picker">
                        {layouts.map((layout, i) => (
                            <button key={i} onClick={() => handleLayoutChange(layout)} className={`layout-option`}>
                                {layout.map((flex, j) => <div key={j} className="col" style={{flexGrow: flex}}></div>)}
                            </button>
                        ))}
                    </div>
                </Accordion>}
                {isContainer && <Accordion title="Layout" icon={LayoutIcon}>
                    <StyleInput label="Display" value={currentStylesForEditing.display} onChange={val => handleStyleChange('display', val)} type="select" options={[{value: 'flex', label: 'Flex'}, {value: 'grid', label: 'Grid'}, {value: 'block', label: 'Block'}]} />
                    {currentStylesForEditing.display === 'flex' && <>
                        <StyleInput label="Direction" value={currentStylesForEditing.flexDirection} onChange={val => handleStyleChange('flexDirection', val)} type="select" options={[{value: 'row', label: 'Row'}, {value: 'column', label: 'Column'}]} />
                        <StyleInput label="Justify" value={currentStylesForEditing.justifyContent} onChange={val => handleStyleChange('justifyContent', val)} type="select" options={[{value: 'flex-start', label: 'Start'}, {value: 'center', label: 'Center'}, {value: 'flex-end', label: 'End'}, {value: 'space-between', label: 'Space Between'}]} />
                        <StyleInput label="Align" value={currentStylesForEditing.alignItems} onChange={val => handleStyleChange('alignItems', val)} type="select" options={[{value: 'flex-start', label: 'Start'}, {value: 'center', label: 'Center'}, {value: 'flex-end', label: 'End'}, {value: 'stretch', label: 'Stretch'}]} />
                    </>}
                    {currentStylesForEditing.display === 'grid' && <>
                        <StyleInput label="Columns" value={currentStylesForEditing.gridTemplateColumns} onChange={val => handleStyleChange('gridTemplateColumns', val)} placeholder="e.g. 1fr 1fr" />
                        <StyleInput label="Rows" value={currentStylesForEditing.gridTemplateRows} onChange={val => handleStyleChange('gridTemplateRows', val)} placeholder="e.g. auto 1fr" />
                    </>}
                    <StyleInput label="Gap" value={currentStylesForEditing.gap} onChange={val => handleStyleChange('gap', val)} />
                </Accordion>}
                 <Accordion title="Typography">
                    <ColorPicker label="Text Color" value={currentStylesForEditing.color} onChange={v => handleStyleChange('color', v)} globalColors={websiteData.globalStyles.colors} />
                 </Accordion>
                 <Accordion title="Background">
                    <BackgroundPicker 
                        value={currentStylesForEditing}
                        onChange={handleStyleChange}
                        globalColors={websiteData.globalStyles.colors}
                        onOpenAssetManager={onOpenAssetManager}
                    />
                 </Accordion>
                 <Accordion title="Spacing">
                     <FourSidedControl label="Margin" values={{Top: currentStylesForEditing.marginTop, Bottom: currentStylesForEditing.marginBottom, Left: currentStylesForEditing.marginLeft, Right: currentStylesForEditing.marginRight}} onChange={(s,v) => handleStyleChange(`margin${s}` as any, v)}/>
                     <FourSidedControl label="Padding" values={{Top: currentStylesForEditing.paddingTop, Bottom: currentStylesForEditing.paddingBottom, Left: currentStylesForEditing.paddingLeft, Right: currentStylesForEditing.paddingRight}} onChange={(s,v) => handleStyleChange(`padding${s}` as any, v)}/>
                 </Accordion>
                 <Accordion title="Sizing">
                    <StyleInput label="Width" value={currentStylesForEditing.width} onChange={v => handleStyleChange('width', v)} />
                    <StyleInput label="Height" value={currentStylesForEditing.height} onChange={v => handleStyleChange('height', v)} />
                     {node.type === 'image' && <>
                        <StyleInput label="Object Fit" value={currentStylesForEditing.objectFit} onChange={v => handleStyleChange('objectFit', v)} type="select" options={[{value: 'cover', label: 'Cover'}, {value: 'contain', label: 'Contain'}, {value: 'fill', label: 'Fill'}]} />
                        <StyleInput label="Aspect Ratio" value={currentStylesForEditing.aspectRatio} onChange={v => handleStyleChange('aspectRatio', v)} placeholder="e.g. 16 / 9"/>
                    </>}
                 </Accordion>
                 <Accordion title="Position">
                    <StyleInput label="Position" value={currentStylesForEditing.position} onChange={v => handleStyleChange('position', v)} type="select" options={[{value: 'static', label: 'Static'}, {value: 'relative', label: 'Relative'}, {value: 'absolute', label: 'Absolute'}, {value: 'fixed', label: 'Fixed'}, {value: 'sticky', label: 'Sticky'}]} />
                    <StyleInput label="Z-Index" value={currentStylesForEditing.zIndex} onChange={v => handleStyleChange('zIndex', v)} type="number" />
                     <div className="grid grid-cols-2 gap-2 mt-2">
                        <StyleInput label="Top" value={currentStylesForEditing.top} onChange={v => handleStyleChange('top', v)} />
                        <StyleInput label="Bottom" value={currentStylesForEditing.bottom} onChange={v => handleStyleChange('bottom', v)} />
                        <StyleInput label="Left" value={currentStylesForEditing.left} onChange={v => handleStyleChange('left', v)} />
                        <StyleInput label="Right" value={currentStylesForEditing.right} onChange={v => handleStyleChange('right', v)} />
                     </div>
                 </Accordion>
                 <Accordion title="Effects">
                    <StyleInput label="Opacity" value={currentStylesForEditing.opacity} onChange={v => handleStyleChange('opacity', v)} type="range" min={0} max={1} step={0.1}/>
                    <StyleInput label="Transform" value={currentStylesForEditing.transform} onChange={v => handleStyleChange('transform', v)} placeholder="e.g. rotate(10deg)"/>
                    <StyleInput label="Filter" value={currentStylesForEditing.filter} onChange={v => handleStyleChange('filter', v)} placeholder="e.g. blur(5px)"/>
                 </Accordion>
                 <Accordion title="Custom CSS">
                    <textarea value={node.customCss || ''} onChange={e => onUpdate(node.id, { customCss: e.target.value })} className="w-full p-2 border rounded font-mono text-xs" rows={5} placeholder={`selector {\n  /* Your CSS here */\n}`}/>
                 </Accordion>
             </div>
        </div>
    );
};
export default StylePanel;
