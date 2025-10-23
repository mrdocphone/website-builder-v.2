import React from 'react';
import type { ElementType } from '../types';
import { XIcon, HeadlineIcon, TextIcon, ImageIcon } from './icons';

interface AddElementModalProps {
    onAdd: (type: ElementType) => void;
    onClose: () => void;
}

const AddElementModal: React.FC<AddElementModalProps> = ({ onAdd, onClose }) => {
    const availableElements: { type: ElementType, label: string, icon: React.FC<any> }[] = [
        { type: 'headline', label: 'Headline', icon: HeadlineIcon },
        { type: 'text', label: 'Text', icon: TextIcon },
        { type: 'image', label: 'Image', icon: ImageIcon },
        // { type: 'button', label: 'Button', icon: ButtonIcon }, // Future element
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 className="text-xl font-bold text-slate-800 mb-6">Add an Element</h2>
                <div className="grid grid-cols-2 gap-4">
                    {availableElements.map(({ type, label, icon: Icon }) => (
                        <button 
                            key={type} 
                            onClick={() => onAdd(type)} 
                            className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                        >
                           <Icon className="w-8 h-8 mb-2 text-indigo-500" />
                           <span className="text-md font-semibold text-slate-700">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AddElementModal;
