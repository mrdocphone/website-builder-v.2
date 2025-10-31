import React from 'react';
import { DuplicateIcon, TrashIcon, CopyIcon, PasteIcon, LockIcon, UnlockIcon } from './icons';
import type { WebsiteNode } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId: string;
  node: WebsiteNode | null;
  onClose: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCopyStyles: () => void;
  onPasteStyles: () => void;
  onCopyNode: () => void;
  onPasteNode: () => void;
  onToggleLock: () => void;
  canPasteStyles: boolean;
  canPasteNode: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  node,
  onClose,
  onDuplicate,
  onDelete,
  onCopyStyles,
  onPasteStyles,
  onCopyNode,
  onPasteNode,
  onToggleLock,
  canPasteStyles,
  canPasteNode,
}) => {
  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  if (!node) return null;

  return (
    <div className="context-menu fixed flex flex-col py-1 rounded-md shadow-lg text-sm z-50" style={{ top: y, left: x }} onClick={(e) => e.stopPropagation()}>
       <button onClick={() => handleAction(onToggleLock)} className="context-menu-item flex items-center px-3 py-1.5 hover:bg-slate-100">
        {node.locked ? <UnlockIcon className="w-4 h-4 mr-2" /> : <LockIcon className="w-4 h-4 mr-2" />}
        {node.locked ? 'Unlock' : 'Lock'}
      </button>
      <div className="context-menu-separator my-1"></div>
      <button onClick={() => handleAction(onCopyNode)} className="context-menu-item flex items-center px-3 py-1.5 hover:bg-slate-100">
        <CopyIcon className="w-4 h-4 mr-2" />
        Copy Element
      </button>
       <button onClick={() => handleAction(onPasteNode)} disabled={!canPasteNode} className="context-menu-item flex items-center px-3 py-1.5 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
        <PasteIcon className="w-4 h-4 mr-2" />
        Paste Element
      </button>
       <div className="context-menu-separator my-1"></div>
      <button onClick={() => handleAction(onCopyStyles)} className="context-menu-item flex items-center px-3 py-1.5 hover:bg-slate-100">
        <CopyIcon className="w-4 h-4 mr-2" />
        Copy Styles
      </button>
      <button onClick={() => handleAction(onPasteStyles)} disabled={!canPasteStyles} className="context-menu-item flex items-center px-3 py-1.5 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
        <PasteIcon className="w-4 h-4 mr-2" />
        Paste Styles
      </button>
      <div className="context-menu-separator my-1"></div>
      <button onClick={() => handleAction(onDuplicate)} className="context-menu-item flex items-center px-3 py-1.5 hover:bg-slate-100">
        <DuplicateIcon className="w-4 h-4 mr-2" />
        Duplicate
      </button>
      <button onClick={() => handleAction(onDelete)} className="context-menu-item danger flex items-center px-3 py-1.5 hover:bg-red-50 text-red-600">
        <TrashIcon className="w-4 h-4 mr-2" />
        Delete
      </button>
    </div>
  );
};

export default ContextMenu;
