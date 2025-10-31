import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BoldIcon, ItalicIcon, UnderlineIcon, ChainLinkIcon } from './icons';

const RichTextToolbar: React.FC = () => {
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});
  const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);
  const lastSelection = useRef<Range | null>(null);

  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
        if (document.activeElement?.hasAttribute('contenteditable')) {
            updateActiveFormats();
        }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('click', updateActiveFormats);
    return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
        document.removeEventListener('click', updateActiveFormats);
    }
  }, [updateActiveFormats]);

  const applyFormat = (format: string) => {
    // This is deprecated but the simplest solution for contentEditable
    document.execCommand(format, false);
    updateActiveFormats();
    (document.activeElement as HTMLElement)?.focus();
  };

  const handleLinkButtonClick = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      lastSelection.current = selection.getRangeAt(0);
    }
    setIsLinkEditorOpen(true);
  };
  
  useEffect(() => {
    if (isLinkEditorOpen) {
        linkInputRef.current?.focus();
    }
  }, [isLinkEditorOpen]);

  const applyLink = () => {
    if (lastSelection.current) {
        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(lastSelection.current);
        }
    }
    document.execCommand('createLink', false, linkUrl);
    setIsLinkEditorOpen(false);
    setLinkUrl('');
    (document.activeElement as HTMLElement)?.focus();
  };
  
  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="rich-text-toolbar" onMouseDown={handleToolbarMouseDown}>
      <button
        onClick={() => applyFormat('bold')}
        className={`rich-text-toolbar-button ${activeFormats.bold ? 'active' : ''}`}
        title="Bold"
      >
        <BoldIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => applyFormat('italic')}
        className={`rich-text-toolbar-button ${activeFormats.italic ? 'active' : ''}`}
        title="Italic"
      >
        <ItalicIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => applyFormat('underline')}
        className={`rich-text-toolbar-button ${activeFormats.underline ? 'active' : ''}`}
        title="Underline"
      >
        <UnderlineIcon className="w-5 h-5" />
      </button>
      <button
        onClick={handleLinkButtonClick}
        className="rich-text-toolbar-button"
        title="Link"
      >
        <ChainLinkIcon className="w-5 h-5" />
      </button>
      {isLinkEditorOpen && (
          <div className="rich-text-link-popover">
              <input 
                ref={linkInputRef}
                type="text" 
                value={linkUrl} 
                onChange={e => setLinkUrl(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } }}
                placeholder="https://example.com"
              />
              <button onClick={applyLink}>Set</button>
          </div>
      )}
    </div>
  );
};

export default RichTextToolbar;
