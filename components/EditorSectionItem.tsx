import React from 'react';
import type { Section } from '../types';
import SectionEditorForm from './SectionEditorForm';
import { ArrowUpIcon, ArrowDownIcon, PencilIcon, TrashIcon } from './icons';

interface EditorSectionItemProps {
    section: Section;
    index: number;
    totalSections: number;
    editingSectionId: string | null;
    isGenerating: boolean;
    onMoveSection: (sectionId: string, direction: 'up' | 'down') => void;
    onRemoveSection: (sectionId: string) => void;
    onToggleEdit: (sectionId: string) => void;
    onContentChange: (sectionId: string, newContent: any) => void;
    onGenerate: (section: Section) => void;
}

const EditorSectionItem: React.FC<EditorSectionItemProps> = ({
    section,
    index,
    totalSections,
    editingSectionId,
    isGenerating,
    onMoveSection,
    onRemoveSection,
    onToggleEdit,
    onContentChange,
    onGenerate,
}) => {
    const isEditing = editingSectionId === section.id;

    return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
                <span className="font-medium text-slate-600 capitalize">{section.type}</span>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onMoveSection(section.id, 'up')} disabled={index === 0} className="disabled:opacity-30"><ArrowUpIcon className="w-5 h-5 text-slate-500 hover:text-slate-800"/></button>
                    <button onClick={() => onMoveSection(section.id, 'down')} disabled={index === totalSections - 1} className="disabled:opacity-30"><ArrowDownIcon className="w-5 h-5 text-slate-500 hover:text-slate-800"/></button>
                    <button onClick={() => onToggleEdit(section.id)}><PencilIcon className={`w-5 h-5 transition-colors ${isEditing ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`} /></button>
                    <button onClick={() => onRemoveSection(section.id)}><TrashIcon className="w-5 h-5 text-red-400 hover:text-red-600"/></button>
                </div>
            </div>
            {isEditing && (
                <SectionEditorForm 
                    section={section}
                    onContentChange={onContentChange}
                    onGenerate={onGenerate}
                    isGenerating={isGenerating}
                />
            )}
        </div>
    );
};

export default React.memo(EditorSectionItem);
