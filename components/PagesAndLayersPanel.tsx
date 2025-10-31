import React, { useState, useRef, useEffect } from 'react';
import type { Page, WebsiteNode, Device } from '../types';
import LayerItem from './LayerItem';
import { PlusIcon, MoreVerticalIcon, SettingsIcon, DuplicateIcon, TrashIcon } from './icons';
import { findNodeById, findNodePath } from '../utils/tree';

interface PagesAndLayersPanelProps {
    pages: Page[];
    activePageId: string | null;
    contentTree: WebsiteNode[];
    device: Device;
    selectedNodeIds: string[];
    onSelectPage: (id: string) => void;
    onCreatePage: () => void;
    onDuplicatePage: (id: string) => void;
    onDeletePage: (id: string) => void;
    onOpenPageSettings: (id: string) => void;
    onSelectNode: (id: string, e: React.MouseEvent) => void;
    onUpdateNode: (id: string, updates: Partial<WebsiteNode>) => void;
    onToggleVisibility: (id: string) => void;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragOver: (e: React.DragEvent, id: string) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    dropTarget: { targetId: string; position: 'top' | 'bottom' } | null;
}

const PageKebabMenu: React.FC<{ page: Page; onSettings: () => void; onDuplicate: () => void; onDelete: () => void; onClose: () => void }> = ({ page, onSettings, onDuplicate, onDelete, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={menuRef} className="kebab-menu-dropdown w-48 rounded-md shadow-lg text-sm py-1 z-10">
            <button onClick={() => { onSettings(); onClose(); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100">
                <SettingsIcon className="w-4 h-4" /> Settings
            </button>
            <button onClick={() => { onDuplicate(); onClose(); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100">
                <DuplicateIcon className="w-4 h-4" /> Duplicate
            </button>
            <div className="my-1 h-px bg-slate-200"></div>
            <button onClick={() => { onDelete(); onClose(); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50">
                <TrashIcon className="w-4 h-4" /> Delete Page
            </button>
        </div>
    );
};


const PagesAndLayersPanel: React.FC<PagesAndLayersPanelProps> = ({
    pages,
    activePageId,
    contentTree,
    device,
    selectedNodeIds,
    onSelectPage,
    onCreatePage,
    onDuplicatePage,
    onDeletePage,
    onOpenPageSettings,
    onSelectNode,
    onUpdateNode,
    onToggleVisibility,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    dropTarget
}) => {
    const [openKebabMenu, setOpenKebabMenu] = useState<string | null>(null);
    const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
    const [renamingText, setRenamingText] = useState('');
    const [collapsedLayers, setCollapsedLayers] = useState<Set<string>>(new Set());

    const handleStartRename = (id: string) => {
        const node = findNodeById(contentTree, id);
        if (node) {
            setRenamingNodeId(id);
            setRenamingText(node.customName || node.type);
        }
    };

    const handleCommitRename = () => {
        if (renamingNodeId) {
            onUpdateNode(renamingNodeId, { customName: renamingText });
        }
        setRenamingNodeId(null);
        setRenamingText('');
    };
    
    const onToggleCollapse = (id: string) => {
        setCollapsedLayers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    // Auto-expand parents of selected node
    useEffect(() => {
        if (selectedNodeIds.length > 0) {
            const selectedId = selectedNodeIds[0];
            const path = findNodePath(contentTree, selectedId);
            if (path) {
                setCollapsedLayers(prev => {
                    const newSet = new Set(prev);
                    // un-collapse parents
                    path.slice(0, -1).forEach(node => newSet.delete(node.id)); 
                    return newSet;
                });
            }
        }
    }, [selectedNodeIds, contentTree]);

    return (
        <div className="pages-and-layers-panel">
            <div className="panel-section">
                <div className="panel-header">
                    <h4>Pages</h4>
                    <button onClick={onCreatePage} className="panel-header-button"><PlusIcon className="w-4 h-4" /></button>
                </div>
                <div className="panel-content">
                    {pages.map(page => (
                        <div key={page.id} className={`page-item ${activePageId === page.id ? 'active' : ''}`}>
                            <div onClick={() => onSelectPage(page.id)} className="page-item-name">
                                {page.name}
                                {page.isHomepage && <span className="homepage-indicator"> (Home)</span>}
                            </div>
                            <div className="relative">
                                <button onClick={(e) => { e.stopPropagation(); setOpenKebabMenu(openKebabMenu === page.id ? null : page.id); }} className="p-1 rounded-full hover:bg-slate-200">
                                    <MoreVerticalIcon className="w-4 h-4" />
                                </button>
                                {openKebabMenu === page.id && (
                                    <PageKebabMenu 
                                        page={page} 
                                        onSettings={() => onOpenPageSettings(page.id)}
                                        onDuplicate={() => onDuplicatePage(page.id)}
                                        onDelete={() => onDeletePage(page.id)}
                                        onClose={() => setOpenKebabMenu(null)}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="panel-section">
                <div className="panel-header">
                    <h4>Layers</h4>
                </div>
                <div className="panel-content layers-tree">
                    {contentTree.map(node => (
                        <LayerItem
                            key={node.id}
                            node={node}
                            device={device}
                            selectedNodeIds={selectedNodeIds}
                            renamingNodeId={renamingNodeId}
                            renamingText={renamingText}
                            collapsedLayers={collapsedLayers}
                            onToggleCollapse={onToggleCollapse}
                            onSelectNode={onSelectNode}
                            onStartRename={handleStartRename}
                            onSetRenamingText={setRenamingText}
                            onCommitRename={handleCommitRename}
                            onToggleVisibility={onToggleVisibility}
                            onDragStart={onDragStart}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            dropTarget={dropTarget}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PagesAndLayersPanel;
