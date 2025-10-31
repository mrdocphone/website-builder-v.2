import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, ChainLinkIcon, StrikethroughIcon, ListOrderedIcon, ListUnorderedIcon, BlockquoteIcon, TextColorIcon } from './icons';

const RichTextToolbar: React.FC = () => {
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);
  const lastSelection = useRef<Range | null>(null);

  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikethrough'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
    });
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
        if (document.activeElement?.hasAttribute('contenteditable')) {
            updateActiveFormats();
        }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [updateActiveFormats]);
  
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      lastSelection.current = selection.getRangeAt(0);
    }
  }
  
  const restoreSelection = () => {
     if (lastSelection.current) {
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(lastSelection.current);
        }
    }
  }

  const applyFormat = (format: string, value?: string) => {
    document.execCommand(format, false, value);
    updateActiveFormats();
    document.activeElement instanceof HTMLElement && document.activeElement.focus();
  };
  
  // FIX: Re-engineered to use spans with inline styles instead of deprecated `foreColor`
  const applyColor = (color: string) => {
    restoreSelection();
    if (lastSelection.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.style.color = color;
            
            // If the selection is collapsed (a cursor), start typing with the new color
            if (range.collapsed) {
                // This is complex to manage without a full editor library. 
                // For now, we only support coloring selections.
            } else {
                 // Surround the selected content with the new span
                span.appendChild(range.extractContents());
                range.insertNode(span);
            }
            selection.removeAllRanges();
        }
    }
    setIsColorPickerOpen(false);
    document.activeElement instanceof HTMLElement && document.activeElement.focus();
  };


  const toggleLink = () => {
    saveSelection();
    setIsLinkEditorOpen(true);
    setTimeout(() => linkInputRef.current?.focus(), 0);
  }

  const handleSetLink = () => {
    restoreSelection();
    if (lastSelection.current) {
        document.execCommand('createLink', false, linkUrl);
    }
    setIsLinkEditorOpen(false);
    setLinkUrl('');
    document.activeElement instanceof HTMLElement && document.activeElement.focus();
  }
  
  const handleColorPickerToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      saveSelection();
      setIsColorPickerOpen(!isColorPickerOpen);
  }
  
  const colors = ['#000000', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#0EA5E9', '#4F46E5', '#D946EF', '#64748B', '#FFFFFF'];

  return (
    <div className="rich-text-toolbar" onMouseDown={(e) => e.preventDefault()}>
      <button onClick={() => applyFormat('bold')} className={`rich-text-toolbar-button ${activeFormats.bold ? 'active' : ''}`}><BoldIcon className="w-5 h-5"/></button>
      <button onClick={() => applyFormat('italic')} className={`rich-text-toolbar-button ${activeFormats.italic ? 'active' : ''}`}><ItalicIcon className="w-5 h-5"/></button>
      <button onClick={() => applyFormat('underline')} className={`rich-text-toolbar-button ${activeFormats.underline ? 'active' : ''}`}><UnderlineIcon className="w-5 h-5"/></button>
      <button onClick={() => applyFormat('strikethrough')} className={`rich-text-toolbar-button ${activeFormats.strikethrough ? 'active' : ''}`}><StrikethroughIcon className="w-5 h-5"/></button>
      <button onClick={() => applyFormat('insertOrderedList')} className={`rich-text-toolbar-button ${activeFormats.insertOrderedList ? 'active' : ''}`}><ListOrderedIcon className="w-5 h-5"/></button>
      <button onClick={() => applyFormat('insertUnorderedList')} className={`rich-text-toolbar-button ${activeFormats.insertUnorderedList ? 'active' : ''}`}><ListUnorderedIcon className="w-5 h-5"/></button>
      <button onClick={toggleLink} className="rich-text-toolbar-button"><ChainLinkIcon className="w-5 h-5"/></button>
      <div className="relative">
          <button onClick={handleColorPickerToggle} className="rich-text-toolbar-button"><TextColorIcon className="w-5 h-5"/></button>
          {isColorPickerOpen && (
              <div className="rich-text-color-popover">
                 {colors.map(color => <button key={color} style={{backgroundColor: color}} className={`w-6 h-6 rounded border ${color === '#FFFFFF' ? 'border-slate-300' : 'border-transparent'}`} onClick={() => applyColor(color)} />)}
              </div>
          )}
      </div>

      {isLinkEditorOpen && (
        <div className="rich-text-link-popover">
          <input ref={linkInputRef} type="text" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://example.com" onKeyDown={(e) => e.key === 'Enter' && handleSetLink()}/>
          <button onClick={handleSetLink}>Set</button>
        </div>
      )}
    </div>
  );
};

export default RichTextToolbar;
