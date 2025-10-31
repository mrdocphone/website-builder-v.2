import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, ChainLinkIcon, StrikethroughIcon, ListOrderedIcon, ListUnorderedIcon, BlockquoteIcon, TextColorIcon, XIcon } from './icons';

const RichTextToolbar: React.FC = () => {
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);
  const lastSelection = useRef<Range | null>(null);

  const getParentLink = (selection: Selection | null): HTMLAnchorElement | null => {
      if (!selection || selection.rangeCount === 0) return null;
      let node = selection.getRangeAt(0).startContainer;
      while (node && node.nodeName !== 'A') {
          node = node.parentNode!;
      }
      return node as HTMLAnchorElement;
  };

  const updateActiveFormats = useCallback(() => {
    const selection = window.getSelection();
    const parentLink = getParentLink(selection);

    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikethrough'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      link: !!parentLink,
    });
    
    // Auto-open link editor if cursor is inside a link
    if (parentLink) {
        setLinkUrl(parentLink.getAttribute('href') || '');
        // Don't auto-open if it was manually closed
        // setIsLinkEditorOpen(true);
    } else if (!isLinkEditorOpen) {
        setIsLinkEditorOpen(false);
    }

  }, [isLinkEditorOpen]);

  useEffect(() => {
    const handleSelectionChange = () => {
        if (document.activeElement?.hasAttribute('contenteditable')) {
            updateActiveFormats();
        }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    // Add a click listener to handle link selection
    document.addEventListener('click', handleSelectionChange);
    return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
        document.removeEventListener('click', handleSelectionChange);
    }
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

  // FIX: Restore selection before executing command to prevent formatting errors.
  const applyFormat = (format: string, value?: string) => {
    restoreSelection();
    document.execCommand(format, false, value);
    updateActiveFormats();
    document.activeElement instanceof HTMLElement && document.activeElement.focus();
  };
  
  const applyColor = (color: string) => {
    restoreSelection();
    if (lastSelection.current) {
        // Use the browser's built-in command for coloring. It's more robust for complex selections.
        // styleWithCSS ensures it uses <span> tags with styles instead of deprecated <font> tags.
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand('foreColor', false, color);
    }
    setIsColorPickerOpen(false);
    updateActiveFormats();
    document.activeElement instanceof HTMLElement && document.activeElement.focus();
  };


  const toggleLink = () => {
    saveSelection();
    const parentLink = getParentLink(window.getSelection());
    if (parentLink) {
        setLinkUrl(parentLink.getAttribute('href') || '');
    }
    setIsLinkEditorOpen(!isLinkEditorOpen);
    setTimeout(() => linkInputRef.current?.focus(), 0);
  }

  const handleSetLink = () => {
    restoreSelection();
    if (lastSelection.current) {
        // If selection is collapsed and we're inside a link, modify the existing link
        const parentLink = getParentLink(window.getSelection());
        if (parentLink) {
            parentLink.href = linkUrl;
        } else {
            document.execCommand('createLink', false, linkUrl);
        }
    }
    setIsLinkEditorOpen(false);
    setLinkUrl('');
    document.activeElement instanceof HTMLElement && document.activeElement.focus();
  }
  
  const handleUnlink = () => {
    restoreSelection();
    if (lastSelection.current) {
        document.execCommand('unlink', false);
    }
    setIsLinkEditorOpen(false);
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
      <button onMouseDown={saveSelection} onClick={() => applyFormat('bold')} className={`rich-text-toolbar-button ${activeFormats.bold ? 'active' : ''}`}><BoldIcon className="w-5 h-5"/></button>
      <button onMouseDown={saveSelection} onClick={() => applyFormat('italic')} className={`rich-text-toolbar-button ${activeFormats.italic ? 'active' : ''}`}><ItalicIcon className="w-5 h-5"/></button>
      <button onMouseDown={saveSelection} onClick={() => applyFormat('underline')} className={`rich-text-toolbar-button ${activeFormats.underline ? 'active' : ''}`}><UnderlineIcon className="w-5 h-5"/></button>
      <button onMouseDown={saveSelection} onClick={() => applyFormat('strikethrough')} className={`rich-text-toolbar-button ${activeFormats.strikethrough ? 'active' : ''}`}><StrikethroughIcon className="w-5 h-5"/></button>
      <button onMouseDown={saveSelection} onClick={() => applyFormat('insertOrderedList')} className={`rich-text-toolbar-button ${activeFormats.insertOrderedList ? 'active' : ''}`}><ListOrderedIcon className="w-5 h-5"/></button>
      <button onMouseDown={saveSelection} onClick={() => applyFormat('insertUnorderedList')} className={`rich-text-toolbar-button ${activeFormats.insertUnorderedList ? 'active' : ''}`}><ListUnorderedIcon className="w-5 h-5"/></button>
      <button onClick={toggleLink} className={`rich-text-toolbar-button ${activeFormats.link ? 'active' : ''}`}><ChainLinkIcon className="w-5 h-5"/></button>
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
          {activeFormats.link && <button onClick={handleUnlink} title="Unlink" className="p-1 text-red-400 hover:text-red-200"><XIcon className="w-4 h-4" /></button>}
        </div>
      )}
    </div>
  );
};

export default RichTextToolbar;