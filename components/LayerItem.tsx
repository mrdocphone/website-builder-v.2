import React, { useState } from 'react';
import type { WebsiteNode, Device } from '../types';
import { 
    EyeIcon, EyeSlashIcon, LockIcon, 
    PencilIcon, // Text, Headline
    LayoutIcon, // Section, Row
    ColumnIcon, 
    ImageIcon, 
    LinkIcon, // Button
    SpacerIcon,
    StarIcon, // Icon
    VideoIcon,
    FormIcon,
    EmbedIcon,
    NavMenuIcon,
    GalleryIcon,
    DividerIcon,
    MapIcon,
    AccordionIcon,
    TabsIcon,
    SocialIcon
} from './icons';


const nodeIconMap: Record<string, React.FC<any>> = {
    section: LayoutIcon,
    row: LayoutIcon,
    column: ColumnIcon,
    headline: PencilIcon,
    text: PencilIcon,
    image: ImageIcon,
    button: LinkIcon,
    spacer: SpacerIcon,
    icon: StarIcon,
    video: VideoIcon,
    form: FormIcon,
    embed: EmbedIcon,
    navigation: NavMenuIcon,
    gallery: GalleryIcon,
    divider: DividerIcon,
    map: MapIcon,
    accordion: AccordionIcon,
    tabs: TabsIcon,
    socialIcons: SocialIcon,
};


interface LayerItemProps {
    node: WebsiteNode;
    device: Device;
    selectedNodeIds: string[];
    renamingNodeId: string | null;
    onSelectNode: (id: string, e: React.MouseEvent) => void;
    onStartRename: (id: string) => void;
    onRenameNode: (id: string, newName: string) => void;
    onToggleVisibility: (id: string) => void;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragOver: (e: React.DragEvent, id: string) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    dropTarget: { targetId: string; position: 'top' | 'bottom' } | null;
}

const LayerItem: React.FC<LayerItemProps> = ({
    node,
    device,
    selectedNodeIds,
    renamingNodeId,
    onSelectNode,
    onStartRename,
    onRenameNode,
    onToggleVisibility,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    dropTarget,
}) => {
    const isSelected = selectedNodeIds.includes(node.id);
    const isRenaming = renamingNodeId === node.id;
    const [name, setName] = useState(node.customName || node.type);
    
    // Sync local name state if node data changes from parent
    React.useEffect(() => {
        setName(node.customName || node.type);
    }, [node.customName, node.type]);


    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onStartRename(node.id);
    };

    const handleBlur = () => {
        onRenameNode(node.id, name);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleBlur();
        }
    };
    
    const isVisibleOnDevice = node.visibility?.[device] !== false;
    const showDropIndicatorTop = dropTarget?.targetId === node.id && dropTarget.position === 'top';
    const showDropIndicatorBottom = dropTarget?.targetId === node.id && dropTarget.position === 'bottom';
    const NodeIcon = nodeIconMap[node.type] || LayoutIcon;

    return (
        <div 
            className="layer-item-wrapper" 
            onDoubleClick={handleDoubleClick}
            draggable="true"
            onDragStart={(e) => onDragStart(e, node.id)}
            onDragOver={(e) => onDragOver(e, node.id)}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {showDropIndicatorTop && <div className="drop-indicator-top"></div>}
            <div className={`layer-item ${isSelected ? 'selected' : ''}`} onClick={(e) => onSelectNode(node.id, e)}>
                <div className="layer-item-content">
                    <NodeIcon className="layer-item-icon" />
                    {isRenaming ? (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="bg-transparent outline-none w-full p-0 border-none focus:ring-0"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className={`${!isVisibleOnDevice ? 'text-slate-400' : ''}`}>{node.customName || node.type}</span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                    {node.locked && <LockIcon className="w-3.5 h-3.5" title="Locked"/>}
                     <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(node.id); }} className="p-0.5 rounded hover:bg-slate-200">
                        {isVisibleOnDevice ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
                     </button>
                </div>
            </div>
            {'children' in node && Array.isArray(node.children) && node.children.length > 0 && (
                <div className="layer-children">
                    {node.children.map(child => (
                        <LayerItem key={child.id} {...({node:child, device, selectedNodeIds, renamingNodeId, onSelectNode, onStartRename, onRenameNode, onToggleVisibility, onDragStart, onDragOver, onDragLeave, onDrop, dropTarget})} />
                    ))}
                </div>
            )}
            {showDropIndicatorBottom && <div className="drop-indicator-bottom"></div>}
        </div>
    );
};

export default LayerItem;