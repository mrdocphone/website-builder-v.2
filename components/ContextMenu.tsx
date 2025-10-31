
import React from 'react';
import { DuplicateIcon, TrashIcon, CopyIcon, PasteIcon } from './icons';

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  onClose: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCopyStyles: () => void;
  onPasteStyles: () => void;
  canPasteStyles: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onDuplicate,
  onDelete,
  onCopyStyles,
  onPasteStyles,
  canPasteStyles,
}) => {
  // Clicks on the menu items should execute the action and then close the menu.
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div className="context-menu" style={{ top: y, left: x }} onClick={(e) => e.stopPropagation()}>
      <button onClick={() => handleAction(onDuplicate)} className="context-menu-item">
        <DuplicateIcon className="w-4 h-4 mr-2" />
        Duplicate
      </button>
      <div className="context-menu-separator"></div>
      <button onClick={() => handleAction(onCopyStyles)} className="context-menu-item">
        <CopyIcon className="w-4 h-4 mr-2" />
        Copy Styles
      </button>
      <button onClick={() => handleAction(onPasteStyles)} disabled={!canPasteStyles} className="context-menu-item">
        <PasteIcon className="w-4 h-4 mr-2" />
        Paste Styles
      </button>
      <div className="context-menu-separator"></div>
      <button onClick={() => handleAction(onDelete)} className="context-menu-item danger">
        <TrashIcon className="w-4 h-4 mr-2" />
        Delete
      </button>
    </div>
  );
};

export default ContextMenu;
