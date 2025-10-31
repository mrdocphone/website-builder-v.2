
import React, { useState, useRef, useEffect } from 'react';
import { MagicWandIcon } from './icons';
import type { WebsiteNode } from '../types';

interface AiToolbarProps {
    node: WebsiteNode;
    onAiAction: (nodeId: string, action: string, options?: { tone?: string }) => void;
    isLoading?: boolean;
}

const AiToolbar: React.FC<AiToolbarProps> = ({ node, onAiAction, isLoading }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isToneMenuOpen, setIsToneMenuOpen] = useState(false);
    const toolbarRef = useRef<HTMLDivElement>(null);

    const handleAction = (action: string, options?: { tone?: string }) => {
        onAiAction(node.id, action, options);
        setIsMenuOpen(false);
        setIsToneMenuOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
                setIsToneMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const tones = ['Professional', 'Casual', 'Playful', 'Confident'];

    return (
        <div className="ai-toolbar" ref={toolbarRef}>
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="ai-toolbar-button"
                title="AI Text Assistant"
                disabled={isLoading}
            >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <MagicWandIcon className="w-5 h-5" />
                )}
            </button>

            {isMenuOpen && (
                <div className="ai-popover">
                    {isToneMenuOpen ? (
                        <>
                             <button onClick={() => setIsToneMenuOpen(false)} className="ai-popover-button font-semibold">&larr; Back</button>
                             {tones.map(tone => (
                                <button key={tone} onClick={() => handleAction('change-tone', { tone: tone.toLowerCase() })} className="ai-popover-button">
                                    {tone}
                                </button>
                             ))}
                        </>
                    ) : (
                        <>
                            <button onClick={() => handleAction('improve')} className="ai-popover-button">Improve Writing</button>
                            <button onClick={() => handleAction('shorten')} className="ai-popover-button">Shorten</button>
                            <button onClick={() => handleAction('lengthen')} className="ai-popover-button">Lengthen</button>
                            <button onClick={() => setIsToneMenuOpen(true)} className="ai-popover-button">Change Tone &rarr;</button>
                            <hr className="my-1" />
                            <button onClick={() => handleAction('generate')} className="ai-popover-button">Generate Text</button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default AiToolbar;
