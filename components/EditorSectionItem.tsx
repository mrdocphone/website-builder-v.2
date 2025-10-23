import React, { useState } from 'react';
import type { Section } from '../types';
import SectionEditorForm from './SectionEditorForm';
import { PencilIcon, TrashIcon, DragHandleIcon } from './icons';

interface EditorSectionItemProps {
    section: Section;
    selectedSectionId: string | null;
    isGenerating: boolean;
    onMoveSection: (draggedId: string, targetId: string) => void;
    onRemoveSection: (sectionId: string) => void;
    onSelectSection: (sectionId: string) => void;
    onContentChange: (sectionId: string, newContent: any) => void;
    onGenerate: (section: Section) => void;
}

const EditorSectionItem: React.FC<EditorSectionItemProps> = ({
    section,
    selectedSectionId,
    isGenerating,
    onMoveSection,
    onRemoveSection,
    onSelectSection,
    onContentChange,
    onGenerate,
}) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const isSelected = selectedSectionId === section.id;

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("sectionId", section.id);
        e.dataTransfer.effectAllowed = "move";
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        setIsDraggingOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData("sectionId");
        if (draggedId && draggedId !== section.id) {
            onMoveSection(draggedId, section.id);
        }
        setIsDraggingOver(false);
    };


    return (
        <div 
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                bg-white border border-slate-200 rounded-lg shadow-sm transition-shadow duration-200
                ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : ''}
                ${isDraggingOver ? 'dragging-placeholder' : ''}
            `}
        >
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center">
                    <div className="cursor-move touch-none mr-2 text-slate-400">
                        <DragHandleIcon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-600 capitalize">{section.type}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => onSelectSection(section.id)} title="Edit Section"><PencilIcon className={`w-5 h-5 transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`} /></button>
                    <button onClick={() => onRemoveSection(section.id)} title="Delete Section"><TrashIcon className="w-5 h-5 text-red-400 hover:text-red-600"/></button>
                </div>
            </div>
            {isSelected && (
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