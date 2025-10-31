import React, { useState, useRef, useEffect } from 'react';
import type { Page, WebsiteNode, Device } from '../types';
import LayerItem from './LayerItem';
import { PlusIcon, MoreVerticalIcon, SettingsIcon, DuplicateIcon, TrashIcon } from './icons';

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
        <div ref={menuRef} className="page-item-kebab-menu">
            <button onClick={onSettings} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-100"><SettingsIcon className="w-4 h-4"/> Settings</button>
            <button onClick={onDuplicate} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-slate-100"><DuplicateIcon className="w-4 h-4"/> Duplicate</button>
            {!page.isHomepage && <button onClick={onDelete} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"><TrashIcon className="w-4 h-4"/> Delete</button>}
        </div>
    );
};

const PagesAndLayersPanel: React.FC<PagesAndLayersPanelProps> = ({
    pages, activePageId, contentTree, device, selectedNodeIds,
    onSelectPage, onCreatePage, onDuplicatePage, onDeletePage, onOpenPageSettings,
    onSelectNode, onUpdateNode, onToggleVisibility, onDragStart, onDragOver, onDragLeave, onDrop, dropTarget
}) => {
    const [openKebabMenu, setOpenKebabMenu] = useState<string | null>(null);
    const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);

    const handleRenameNode = (id: string, newName: string) => {
        onUpdateNode(id, { customName: newName });
        setRenamingNodeId(null);
    };

    return (
        <div>
            <div className="pages-list">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-sm">Pages</h3>
                    <button onClick={onCreatePage} className="p-1 rounded hover:bg-slate-200"><PlusIcon className="w-5 h-5"/></button>
                </div>
                {pages.map(page => (
                    <div key={page.id} className={`page-item ${page.id === activePageId ? 'active' : ''}`}>
                        <button onClick={() => onSelectPage(page.id)} className="flex-grow text-left">{page.name} {page.isHomepage && '(Home)'}</button>
                        <div className="page-item-kebab">
                            <button onClick={(e) => { e.stopPropagation(); setOpenKebabMenu(openKebabMenu === page.id ? null : page.id); }} className="p-1 rounded hover:bg-slate-300">
                                <MoreVerticalIcon className="w-4 h-4" />
                            </button>
                            {openKebabMenu === page.id && (
                                <PageKebabMenu
                                    page={page}
                                    onSettings={() => { onOpenPageSettings(page.id); setOpenKebabMenu(null); }}
                                    onDuplicate={() => { onDuplicatePage(page.id); setOpenKebabMenu(null); }}
                                    onDelete={() => { onDeletePage(page.id); setOpenKebabMenu(null); }}
                                    onClose={() => setOpenKebabMenu(null)}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-2">
                 <h3 className="font-semibold text-sm mb-2">Layers</h3>
                {contentTree.map(child =>
                    <LayerItem
                        key={child.id}
                        node={child}
                        device={device}
                        selectedNodeIds={selectedNodeIds}
                        renamingNodeId={renamingNodeId}
                        onSelectNode={onSelectNode}
                        onStartRename={setRenamingNodeId}
                        onRenameNode={handleRenameNode}
                        onToggleVisibility={onToggleVisibility}
                        onDragStart={onDragStart}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        dropTarget={dropTarget}
                    />
                )}
            </div>
        </div>
    );
};

export default PagesAndLayersPanel;