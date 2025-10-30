
import React from 'react';
import type { WebsiteNode, Element as ElementType, HeadlineElement, TextElement, ImageElement, ButtonElement, WebsiteData, Section, Row, Column } from '../types';
import { useImmer } from 'use-immer';
import { generateSectionContent } from '../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { MagicWandIcon, TrashIcon, ArrowLeftIcon, PlusIcon } from './icons';

interface SectionEditorFormProps {
  node: WebsiteNode;
  websiteData: WebsiteData;
  onUpdate: (id: string, updates: Partial<WebsiteNode>) => void;
  onDelete: (id: string) => void;
  onAddElement: (parentId: string, type: 'row' | 'column' | ElementType['type']) => void;
  onDeselect: () => void;
}

const StyleInput: React.FC<{ label: string; value: any; onChange: (value: any) => void, type?: string, options?: {value: string, label: string}[] }> = ({ label, value, onChange, type = 'text', options }) => (
  <div className="mb-2">
    <label className="text-xs text-slate-500 block">{label}</label>
    {type === 'select' ? (
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full p-1 border rounded text-sm">
        {options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full p-1 border rounded text-sm" />
    )}
  </div>
);

const SectionEditorForm: React.FC<SectionEditorFormProps> = ({ node, websiteData, onUpdate, onDelete, onAddElement, onDeselect }) => {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleGenerateContent = async (section: Section) => {
        setIsLoading(true);
        try {
            const elementsByColumn = await generateSectionContent(websiteData, section);
            // Update the section with the new elements
            onUpdate(section.id, {
                children: section.children.map((row, rowIndex) => ({
                    ...row,
                    children: row.children.map((col, colIndex) => ({
                        ...col,
                        children: (elementsByColumn[colIndex] || []).map((el: any) => ({
                            id: uuidv4(),
                            styles: {},
                            ...el,
                        }))
                    }))
                }))
            });
        } catch (error) {
            alert('Failed to generate content.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderFormFields = () => {
        const content = (node as any).content || {};
        
        const handleContentChange = (field: string, value: any) => {
            onUpdate(node.id, { content: { ...content, [field]: value } });
        };
        
        switch (node.type) {
            case 'headline':
                return (
                    <>
                        <StyleInput label="Text" value={content.text || ''} onChange={val => handleContentChange('text', val)} />
                        <StyleInput label="Level" value={content.level || 'h2'} onChange={val => handleContentChange('level', val)} type="select" options={[{value: 'h1', label: 'Heading 1'}, {value: 'h2', label: 'Heading 2'}, {value: 'h3', label: 'Heading 3'}]} />
                    </>
                );
            case 'text':
                return <textarea value={content.text || ''} onChange={e => handleContentChange('text', e.target.value)} className="w-full p-1 border rounded text-sm h-32" />;
            case 'image':
                 return (
                    <>
                        <StyleInput label="Image URL" value={content.src || ''} onChange={val => handleContentChange('src', val)} />
                        <StyleInput label="Alt Text" value={content.alt || ''} onChange={val => handleContentChange('alt', val)} />
                    </>
                );
            case 'button':
                return (
                    <>
                        <StyleInput label="Button Text" value={content.text || ''} onChange={val => handleContentChange('text', val)} />
                        <StyleInput label="Link URL" value={content.href || ''} onChange={val => handleContentChange('href', val)} />
                    </>
                );
            case 'section':
                return (
                    <div>
                        <button
                            onClick={() => onAddElement(node.id, 'row')}
                            className="w-full text-sm text-indigo-600 p-2 rounded-md hover:bg-indigo-50 text-left"
                        >
                            <PlusIcon className="w-4 h-4 inline mr-2"/>Add Row
                        </button>
                         <button
                            onClick={() => handleGenerateContent(node as Section)}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center mt-2 bg-purple-600 text-white font-bold py-2 px-4 rounded hover:bg-purple-700 disabled:bg-purple-400"
                        >
                            <MagicWandIcon className="w-5 h-5 mr-2" />
                            {isLoading ? 'Generating...' : 'Generate with AI'}
                        </button>
                    </div>
                );
            case 'row':
                return (
                     <button
                        onClick={() => onAddElement(node.id, 'column')}
                        className="w-full text-sm text-indigo-600 p-2 rounded-md hover:bg-indigo-50 text-left"
                    >
                        <PlusIcon className="w-4 h-4 inline mr-2"/>Add Column
                    </button>
                )
             case 'column':
                const addElementButtons: { type: ElementType['type'], label: string }[] = [
                    { type: 'headline', label: 'Headline' },
                    { type: 'text', label: 'Text' },
                    { type: 'image', label: 'Image' },
                    { type: 'button', label: 'Button' }
                ];
                return (
                    <div className="grid grid-cols-2 gap-2">
                        {addElementButtons.map(btn => (
                            <button key={btn.type} onClick={() => onAddElement(node.id, btn.type)} className="text-sm text-indigo-600 p-2 rounded-md hover:bg-indigo-50 border border-indigo-100">
                                {btn.label}
                            </button>
                        ))}
                    </div>
                );

            default:
                return <p className="text-sm text-slate-500">No editable content for this element.</p>;
        }
    };
    
    const handleStyleChange = (prop: string, value: any) => {
        onUpdate(node.id, { styles: { ...node.styles, [prop]: value } });
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <button onClick={onDeselect} className="text-slate-500 hover:text-slate-800"><ArrowLeftIcon className="w-5 h-5" /></button>
                <h3 className="font-bold text-lg capitalize">{node.type}</h3>
                <button onClick={() => onDelete(node.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5" /></button>
            </div>
            
            <div className="mb-4 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-sm text-slate-600">Content</h4>
                {renderFormFields()}
            </div>
            
             <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-sm text-slate-600">Styling</h4>
                <StyleInput label="Background Color" type="color" value={node.styles.backgroundColor || ''} onChange={val => handleStyleChange('backgroundColor', val)} />
                <StyleInput label="Text Color" type="color" value={node.styles.color || ''} onChange={val => handleStyleChange('color', val)} />
                <StyleInput label="Padding Top" value={node.styles.paddingTop || ''} onChange={val => handleStyleChange('paddingTop', val)} />
                <StyleInput label="Padding Bottom" value={node.styles.paddingBottom || ''} onChange={val => handleStyleChange('paddingBottom', val)} />
                {node.type === 'headline' &&
                  <StyleInput label="Text Align" value={node.styles.textAlign || 'left'} onChange={val => handleStyleChange('textAlign', val)} type="select" options={[{value: 'left', label: 'Left'}, {value: 'center', label: 'Center'}, {value: 'right', label: 'Right'}]} />
                }
             </div>

        </div>
    );
};

export default SectionEditorForm;
