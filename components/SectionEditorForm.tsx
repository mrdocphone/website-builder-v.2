
import React, { useState, useRef, useEffect } from 'react';
import type { WebsiteNode, Device, StyleProperties, Element, IconElement, WebsiteData, FormElement, EmbedElement, GalleryElement, SocialIconsElement, FormField, VideoElement, AccordionElement, TabsElement, Row, Column, NavigationElement, NavLink, Page } from '../types';
import { availableIcons, IconRenderer, DesktopIcon, TabletIcon, MobileIcon, EyeIcon, EyeSlashIcon, PlusIcon, TrashIcon, DragHandleIcon, PencilIcon, GridIcon, AnimationIcon, CheckboxIcon, SelectIcon, TextColorIcon, LayoutIcon, XIcon, ChainLinkIcon, UnlinkIcon } from './icons';
import { v4 as uuidv4 } from 'uuid';

interface StylePanelProps {
  node: WebsiteNode;
  nodePath: WebsiteNode[];
  websiteData: WebsiteData;
  onUpdate: (id: string, updates: Partial<WebsiteNode>) => void;
  onOpenAssetManager: () => void;
  onSelectNode: (id: string) => void;
  device: Device;
}

const ColorPicker: React.FC<{ label: string, value: string | undefined, onChange: (value: string) => void, globalColors: WebsiteData['globalStyles']['colors'] }> = ({ label, value, onChange, globalColors }) => {
    const varName = value?.match(/var\(--(.*?)\)/)?.[1];
    const isGlobal = !!varName;
    const globalColor = globalColors.find(c => c.name.toLowerCase().replace(/\s+/g, '-') === varName);
    
    // FIX: Synchronize text and color inputs with local state for better UX.
    const [textValue, setTextValue] = useState(value || '');
    useEffect(() => { setTextValue(value || ''); }, [value]);

    const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newColor = e.target.value;
        setTextValue(newColor);
        onChange(newColor);
    };
    
    const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTextValue(e.target.value);
    };

    const handleTextInputBlur = () => {
        onChange(textValue);
    };

    return (
        <div className="mb-2">
            <div className="flex items-center justify-between">
                <label className="text-sm text-slate-500 block">{label}</label>
                <div className="flex items-center gap-2 border rounded-md p-1">
                    <input type="color" value={isGlobal ? globalColor?.value : value || '#000000'} onChange={handleColorInputChange} className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer" />
                    <input type="text" value={textValue} onChange={handleTextInputChange} onBlur={handleTextInputBlur} className="w-24 border-none text-sm p-0 focus:ring-0" placeholder="transparent"/>
                    {/* FEAT: Add a clear button to easily remove the color. */}
                    {value && <button onClick={() => onChange('')} className="p-0.5 text-slate-400 hover:text-slate-600" title="Clear color">
                        <XIcon className="w-4 h-4" />
                    </button>}
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
        <label className={`text-sm text-slate-500 block flex items-center ${isInherited ? 'style-input-label-inherited' : ''}`} title={isInherited ? 'Value inherited from a larger screen size' : ''}>
            {label}
        </label>
        {type === 'select' ? (
            <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-1/2 p-1 border rounded text-sm bg-white">
                {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        ) : type === 'range' ? (
            // FIX: Add a numeric display for range inputs for better UX.
            <div className="w-1/2 flex items-center gap-2">
                <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="w-full" {...props} />
                <span className="text-xs text-slate-500 w-8 text-right">{value}</span>
            </div>
        ) : (
            <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`w-1/2 p-1 border rounded text-sm ${type === 'color' ? 'h-8' : ''}`} {...props} />
        )}
    </div>
);

// FEAT: Upgraded FourSidedControl with state to "link" all four values together for faster editing.
const FourSidedControl: React.FC<{ label: string, values: Record<string, string|undefined>, onChange: (side: string, value: string) => void }> = ({ label, values, onChange }) => {
    const [isLinked, setIsLinked] = useState(true);

    const handleSideChange = (side: string, newValue: string) => {
        if (isLinked) {
            onChange('Top', newValue);
            onChange('Bottom', newValue);
            onChange('Left', newValue);
            onChange('Right', newValue);
        } else {
            onChange(side, newValue);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-sm text-slate-500 block">{label}</label>
                <button onClick={() => setIsLinked(!isLinked)} title={isLinked ? "Unlink sides" : "Link sides"} className="p-1 text-slate-400 hover:text-slate-600">
                    {isLinked ? <ChainLinkIcon className="w-4 h-4" /> : <UnlinkIcon className="w-4 h-4" />}
                </button>
            </div>
            {isLinked ? (
                <input type="text" value={values.Top || values.Bottom || values.Left || values.Right || ''} onChange={e => handleSideChange('Top', e.target.value)} placeholder="All sides" className="w-full p-1 border rounded text-sm"/>
            ) : (
                 <>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" value={values.Top || ''} onChange={e => handleSideChange('Top', e.target.value)} placeholder="Top" className="w-full p-1 border rounded text-sm"/>
                        <input type="text" value={values.Bottom || ''} onChange={e => handleSideChange('Bottom', e.target.value)} placeholder="Bottom" className="w-full p-1 border rounded text-sm"/>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                        <input type="text" value={values.Left || ''} onChange={e => handleSideChange('Left', e.target.value)} placeholder="Left" className="w-full p-1 border rounded text-sm"/>
                        <input type="text" value={values.Right || ''} onChange={e => handleSideChange('Right', e.target.value)} placeholder="Right" className="w-full p-1 border rounded text-sm"/>
                    </div>
                </>
            )}
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

const StylePanel: React.FC<StylePanelProps> = ({ node, nodePath, websiteData, onUpdate, onOpenAssetManager, onSelectNode, device }) => {
    const [editingDevice, setEditingDevice] = useState<Device>(device);
    const [editState, setEditState] = useState<'normal' | 'hover'>('normal');
    
    useEffect(() => {
        setEditingDevice(device);
    }, [device]);
    
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
        const totalFlex = layout.reduce((a, b) => a + b, 0);

        const newColumns: Column[] = layout.map((flexValue, i) => {
            const existingCol = oldColumns[i];
            const basis = `${(flexValue / totalFlex) * 100}%`;
            if (existingCol) {
                const newStyles = { ...existingCol.styles };
                if (!newStyles.desktop) newStyles.desktop = {};
                newStyles.desktop.flexBasis = basis;
                return { ...existingCol, styles: newStyles };
            }
            return { id: uuidv4(), type: 'column', styles: { desktop: { flexBasis: basis }, tablet: {}, mobile: {} }, children: [] };
        });

        // FIX: Critical data loss bug. Content from removed columns is now safely appended to the last remaining column.
        if (newColumnCount < oldColumnCount) {
            const childrenToMove = oldColumns.slice(newColumnCount).flatMap(col => col.children);
            if (newColumns.length > 0) {
              newColumns[newColumns.length - 1].children.push(...childrenToMove);
            }
        }

        onUpdate(node.id, { children: newColumns });
    };

    // FIX: This function correctly determines if a style is being inherited from a larger viewport.
    const getInheritedStatus = (prop: keyof StyleProperties): boolean => {
        const styles = node.styles;
        if (!styles) return false;

        if (editingDevice === 'desktop') {
            return false;
        }
        if (editingDevice === 'tablet') {
            const hasOwn = styles.tablet && prop in styles.tablet && styles.tablet[prop] !== undefined;
            const inherited = styles.desktop && prop in styles.desktop && styles.desktop[prop] !== undefined;
            return !hasOwn && inherited;
        }
        if (editingDevice === 'mobile') {
            const hasOwn = styles.mobile && prop in styles.mobile && styles.mobile[prop] !== undefined;
            const inheritedFromTablet = styles.tablet && prop in styles.tablet && styles.tablet[prop] !== undefined;
            const inheritedFromDesktop = styles.desktop && prop in styles.desktop && styles.desktop[prop] !== undefined;
            return !hasOwn && (inheritedFromTablet || inheritedFromDesktop);
        }
        return false;
    };
    
    // FIX: This function stringifies a layout to uniquely identify it for highlighting the active selection.
    const stringifyLayout = (layout: number[]): string => {
        const total = layout.reduce((a, b) => a + b, 0);
        return JSON.stringify(layout.map(l => Math.round((l / total) * 100)));
    };

    const getCurrentLayoutString = (columns: Column[]): string => {
        if (!columns || columns.length === 0) return '';
        const percentages = columns.map(c => Math.round(parseFloat(c.styles.desktop?.flexBasis || '0')));
        const total = percentages.reduce((a, b) => a + b, 0);
        // Allow for minor floating point inaccuracies
        return (total > 98 && total < 102) ? JSON.stringify(percentages) : '';
    };
    
    const currentLayoutStr = node.type === 'row' ? getCurrentLayoutString((node as Row).children) : '';

    const currentStylesForEditing = (editState === 'normal' ? node.styles : node.hoverStyles)?.[editingDevice] || {};
    const content = (node as any).content || {};
    const deviceOptions: { id: Device; icon: React.FC<any> }[] = [ { id: 'desktop', icon: DesktopIcon }, { id: 'tablet', icon: TabletIcon }, { id: 'mobile', icon: MobileIcon }, ];
    const isContainer = ['section', 'row', 'column'].includes(node.type);
    
    const layouts = [ [1], [1, 1], [1, 2], [2, 1], [1, 1, 1], [1, 2, 1], [3, 1], [1, 3], [1, 1, 1, 1]];

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
            case 'navigation': {
                const links: NavLink[] = (node as NavigationElement).content.links || [];
                const handleUpdateLinks = (newLinks: NavLink[]) => handleContentChange('links', newLinks);
                const handleAddLink = () => handleUpdateLinks([...links, { id: uuidv4(), text: 'New Link', type: 'internal', pageId: websiteData.pages[0]?.id, openInNewTab: false }]);
                const handleRemoveLink = (index: number) => handleUpdateLinks(links.filter((_, i) => i !== index));
                const handleLinkChange = (index: number, field: keyof NavLink, value: any) => handleUpdateLinks(links.map((l, i) => i === index ? { ...l, [field]: value } : l));
                
                return (
                    <div className="space-y-2">
                        {links.map((link, index) => (
                            <div key={link.id} className="p-3 border rounded bg-white space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-sm">Link {index + 1}</span>
                                    <button onClick={() => handleRemoveLink(index)} className="p-1 hover:bg-red-50 rounded"><TrashIcon className="w-4 h-4 text-red-500"/></button>
                                </div>
                                <StyleInput label="Text" value={link.text} onChange={val => handleLinkChange(index, 'text', val)} />
                                <StyleInput label="Type" value={link.type} onChange={val => handleLinkChange(index, 'type', val)} type="select" options={[{value:'internal', label:'Internal Page'}, {value:'external', label:'External URL'}]} />
                                {link.type === 'internal' ? (
                                    <StyleInput label="Page" value={link.pageId} onChange={val => handleLinkChange(index, 'pageId', val)} type="select" options={websiteData.pages.map(p => ({ value: p.id, label: p.name }))} />
                                ) : (
                                    <StyleInput label="URL" value={link.href} onChange={val => handleLinkChange(index, 'href', val)} />
                                )}
                                <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={!!link.openInNewTab} onChange={e => handleLinkChange(index, 'openInNewTab', e.target.checked)} /> Open in new tab</label>
                            </div>
                        ))}
                        <button onClick={handleAddLink} className="mt-2 text-indigo-600 text-sm font-semibold flex items-center gap-1"><PlusIcon className="w-4 h-4"/> Add Link</button>
                    </div>
                )
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
                        <div key={field.id} draggable onDragStart={e => handleDragStart(e, index)} onDragOver={e => handleDragOver(e, index)} className={`p-3 border rounded mb-2 bg-white space-y-2 relative cursor-move ${draggedField.current === index ? 'opacity-50' : ''}`}>
                            {dragOverField === index && <div className="absolute inset-x-0 top-0 h-1 bg-indigo-400"></div>}
                            <div className="flex justify-between items-center"><span className="font-medium text-sm flex items-center gap-2"><DragHandleIcon className="w-4 h-4 text-slate-400" /> Field {index + 1}</span><button onClick={() => handleRemoveField(index)} className="p-1 hover:bg-red-50 rounded"><TrashIcon className="w-4 h-4 text-red-500"/></button></div>
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
                            <button key={i} onClick={() => handleLayoutChange(layout)} className={`layout-option ${currentLayoutStr === stringifyLayout(layout) ? 'selected' : ''}`}>
                                {layout.map((flex, j) => <div key={j} className="col" style={{flexGrow: flex}}></div>)}
                            </button>
                        ))}
                    </div>
                </Accordion>}
                {isContainer && <Accordion title="Layout" icon={LayoutIcon}>
                    <StyleInput label="Display" value={currentStylesForEditing.display} onChange={val => handleStyleChange('display', val)} type="select" options={[{value: 'flex', label: 'Flex'}, {value: 'grid', label: 'Grid'}, {value: 'block', label: 'Block'}]} isInherited={getInheritedStatus('display')} />
                    {currentStylesForEditing.display === 'flex' && <>
                        <StyleInput label="Direction" value={currentStylesForEditing.flexDirection} onChange={val => handleStyleChange('flexDirection', val)} type="select" options={[{value: 'row', label: 'Row'}, {value: 'column', label: 'Column'}]} isInherited={getInheritedStatus('flexDirection')}/>
                        <StyleInput label="Justify" value={currentStylesForEditing.justifyContent} onChange={val => handleStyleChange('justifyContent', val)} type="select" options={[{value: 'flex-start', label: 'Start'}, {value: 'center', label: 'Center'}, {value: 'flex-end', label: 'End'}, {value: 'space-between', label: 'Space Between'}]} isInherited={getInheritedStatus('justifyContent')}/>
                        <StyleInput label="Align" value={currentStylesForEditing.alignItems} onChange={val => handleStyleChange('alignItems', val)} type="select" options={[{value: 'flex-start', label: 'Start'}, {value: 'center', label: 'Center'}, {value: 'flex-end', label: 'End'}, {value: 'stretch', label: 'Stretch'}]} isInherited={getInheritedStatus('alignItems')}/>
                    </>}
                    {currentStylesForEditing.display === 'grid' && <>
                        <StyleInput label="Columns" value={currentStylesForEditing.gridTemplateColumns} onChange={val => handleStyleChange('gridTemplateColumns', val)} placeholder="e.g. 1fr 1fr" isInherited={getInheritedStatus('gridTemplateColumns')}/>
                        <StyleInput label="Rows" value={currentStylesForEditing.gridTemplateRows} onChange={val => handleStyleChange('gridTemplateRows', val)} placeholder="e.g. auto 1fr" isInherited={getInheritedStatus('gridTemplateRows')}/>
                    </>}
                    <StyleInput label="Gap" value={currentStylesForEditing.gap} onChange={val => handleStyleChange('gap', val)} isInherited={getInheritedStatus('gap')}/>
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
                    <StyleInput label="Width" value={currentStylesForEditing.width} onChange={v => handleStyleChange('width', v)} isInherited={getInheritedStatus('width')}/>
                    <StyleInput label="Height" value={currentStylesForEditing.height} onChange={v => handleStyleChange('height', v)} isInherited={getInheritedStatus('height')}/>
                     {node.type === 'image' && <>
                        <StyleInput label="Object Fit" value={currentStylesForEditing.objectFit} onChange={v => handleStyleChange('objectFit', v)} type="select" options={[{value: 'cover', label: 'Cover'}, {value: 'contain', label: 'Contain'}, {value: 'fill', label: 'Fill'}]} isInherited={getInheritedStatus('objectFit')}/>
                        <StyleInput label="Aspect Ratio" value={currentStylesForEditing.aspectRatio} onChange={v => handleStyleChange('aspectRatio', v)} placeholder="e.g. 16 / 9" isInherited={getInheritedStatus('aspectRatio')}/>
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