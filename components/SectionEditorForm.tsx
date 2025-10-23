import React from 'react';
import type { Section } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { MagicWandIcon, TrashIcon } from './icons';

interface SectionEditorFormProps {
    section: Section;
    onContentChange: (sectionId: string, newContent: any) => void;
    onGenerate: (section: Section) => void;
    isGenerating: boolean;
}

const SectionEditorForm: React.FC<SectionEditorFormProps> = ({ section, onContentChange, onGenerate, isGenerating }) => {
    const content = section.content as any;

    const baseInput = "w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm";
    const baseLabel = "text-sm font-medium text-slate-600 block mb-1";

    const handleItemChange = (itemId: string, field: string, value: string) => {
        const key = section.type === 'services' ? 'services' : section.type === 'gallery' ? 'images' : 'testimonials';
        const items = content[key];
        const updatedItems = items.map((item: any) => item.id === itemId ? { ...item, [field]: value } : item);
        onContentChange(section.id, { ...content, [key]: updatedItems });
    };

    const handleAddItem = () => {
        let newItem;
        let key;
        switch (section.type) {
            case 'services':
                newItem = { id: uuidv4(), name: 'New Service', description: 'Describe this service.' };
                key = 'services';
                break;
            case 'gallery':
                newItem = { id: uuidv4(), url: `https://picsum.photos/400/300?random=${Math.floor(Math.random() * 100)}`, alt: 'New image' };
                key = 'images';
                break;
            case 'testimonials':
                newItem = { id: uuidv4(), quote: 'A new glowing review!', author: 'New Customer' };
                key = 'testimonials';
                break;
            default: return;
        }
        onContentChange(section.id, { ...content, [key]: [...content[key], newItem] });
    };

    const handleRemoveItem = (itemId: string) => {
        const key = section.type === 'services' ? 'services' : section.type === 'gallery' ? 'images' : 'testimonials';
        const updatedItems = content[key].filter((item: any) => item.id !== itemId);
        onContentChange(section.id, { ...content, [key]: updatedItems });
    };

    return (
        <div className="p-4 border-t border-slate-200 mt-3 bg-slate-50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-700 text-base">Editing: <span className="capitalize">{section.type}</span></h3>
                <button onClick={() => onGenerate(section)} disabled={isGenerating} className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 disabled:cursor-wait">
                    <MagicWandIcon className="w-4 h-4 mr-1" />
                    {isGenerating ? 'Generating...' : 'Generate with AI'}
                </button>
            </div>

            <div className="space-y-4">
                {'title' in content && (
                    <div>
                        <label className={baseLabel}>Section Title</label>
                        <input type="text" value={content.title} onChange={e => onContentChange(section.id, { ...content, title: e.target.value })} className={baseInput} />
                    </div>
                )}

                {section.type === 'about' && (
                    <div>
                        <label className={baseLabel}>Body</label>
                        <textarea value={content.body} onChange={e => onContentChange(section.id, { ...content, body: e.target.value })} rows={6} className={baseInput} />
                    </div>
                )}

                {section.type === 'services' && content.services.map((service: any) => (
                    <div key={service.id} className="p-3 border border-slate-200 rounded-md bg-white relative">
                        <button onClick={() => handleRemoveItem(service.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                        <div className="space-y-2">
                            <div>
                                <label className={baseLabel}>Service Name</label>
                                <input type="text" value={service.name} onChange={e => handleItemChange(service.id, 'name', e.target.value)} className={baseInput} />
                            </div>
                            <div>
                                <label className={baseLabel}>Description</label>
                                <textarea value={service.description} onChange={e => handleItemChange(service.id, 'description', e.target.value)} rows={2} className={baseInput} />
                            </div>
                        </div>
                    </div>
                ))}

                {section.type === 'gallery' && content.images.map((image: any) => (
                    <div key={image.id} className="p-3 border border-slate-200 rounded-md bg-white relative">
                        <button onClick={() => handleRemoveItem(image.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                        <div className="space-y-2">
                            <div>
                                <label className={baseLabel}>Image URL</label>
                                <input type="text" value={image.url} onChange={e => handleItemChange(image.id, 'url', e.target.value)} className={baseInput} />
                            </div>
                            <div>
                                <label className={baseLabel}>Alt Text (for accessibility)</label>
                                <input type="text" value={image.alt} onChange={e => handleItemChange(image.id, 'alt', e.target.value)} className={baseInput} />
                            </div>
                        </div>
                    </div>
                ))}

                {section.type === 'testimonials' && content.testimonials.map((testimonial: any) => (
                    <div key={testimonial.id} className="p-3 border border-slate-200 rounded-md bg-white relative">
                        <button onClick={() => handleRemoveItem(testimonial.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                        <div className="space-y-2">
                            <div>
                                <label className={baseLabel}>Quote</label>
                                <textarea value={testimonial.quote} onChange={e => handleItemChange(testimonial.id, 'quote', e.target.value)} rows={3} className={baseInput} />
                            </div>
                            <div>
                                <label className={baseLabel}>Author</label>
                                <input type="text" value={testimonial.author} onChange={e => handleItemChange(testimonial.id, 'author', e.target.value)} className={baseInput} />
                            </div>
                        </div>
                    </div>
                ))}

                {(section.type === 'services' || section.type === 'gallery' || section.type === 'testimonials') && (
                    <button onClick={handleAddItem} className="w-full text-sm text-indigo-600 border-2 border-dashed border-slate-300 rounded-md py-2 hover:bg-indigo-50 hover:border-indigo-500">
                        + Add {section.type === 'services' ? 'Service' : section.type === 'gallery' ? 'Image' : 'Testimonial'}
                    </button>
                )}

                {section.type === 'contact' && (
                    <div className="space-y-2">
                        <div><label className={baseLabel}>Address</label><input type="text" value={content.address} onChange={e => onContentChange(section.id, { ...content, address: e.target.value })} className={baseInput} /></div>
                        <div><label className={baseLabel}>Phone</label><input type="text" value={content.phone} onChange={e => onContentChange(section.id, { ...content, phone: e.target.value })} className={baseInput} /></div>
                        <div><label className={baseLabel}>Email</label><input type="email" value={content.email} onChange={e => onContentChange(section.id, { ...content, email: e.target.value })} className={baseInput} /></div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SectionEditorForm;
