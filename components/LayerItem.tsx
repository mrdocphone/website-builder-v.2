import React, { useState } from 'react';
import type { WebsiteNode, Device } from '../types';
import { EyeIcon, EyeSlashIcon, LockIcon } from './icons';

interface LayerItemProps {
    node: WebsiteNode;
    device: Device;
    selectedNodeIds: string[];
    onSelectNode: (id: string, e: React.MouseEvent) => void;
    onRenameNode: (id: string, newName: string) => void;
    [key: string]: any; // for other props
}

const LayerItem: React.FC<LayerItemProps> = ({ node, device, selectedNodeIds, onSelectNode, onRenameNode, ...rest }) => {
    const isSelected = selectedNodeIds.includes(node.id);
    const [isRenaming, setIsRenaming] = useState(false);
    const [name, setName] = useState(node.customName || node.type);

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRenaming(true);
    };

    const handleBlur = () => {
        setIsRenaming(false);
        onRenameNode(node.id, name);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };
    
    const isVisibleOnDevice = node.visibility?.[device] !== false;

    return (
        <div className="layer-item-wrapper" onDoubleClick={handleDoubleClick}>
            <div className={`layer-item ${isSelected ? 'selected' : ''}`} onClick={(e) => onSelectNode(node.id, e)}>
                <div className="layer-item-content">
                    <span className="layer-item-icon">&#x25A1;</span>
                    {isRenaming ? (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="bg-transparent outline-none w-full"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span>{node.customName || node.type}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    {node.locked && <LockIcon className="w-3.5 h-3.5" title="Locked"/>}
                    {!isVisibleOnDevice && <EyeSlashIcon className="w-4 h-4" title={`Hidden on ${device}`}/>}
                </div>
            </div>
            {'children' in node && Array.isArray(node.children) && node.children.length > 0 && (
                <div className="layer-children">
                    {node.children.map(child => (
                        <LayerItem key={child.id} node={child as WebsiteNode} device={device} selectedNodeIds={selectedNodeIds} onSelectNode={onSelectNode} onRenameNode={onRenameNode} {...rest} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default LayerItem;
