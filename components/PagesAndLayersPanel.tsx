import React, { useState, useRef, useEffect } from 'react';
import type { Page, WebsiteNode, Device, ElementType, WebsiteData } from '../types';
import LayerItem from './LayerItem';
import { PlusIcon, MoreVerticalIcon, SettingsIcon, DuplicateIcon, TrashIcon } from './icons';
import { findNodeById, findNodePath, createDefaultElement } from '../utils/tree';

interface PagesAndLayersPanelProps {
    pages: Page[];
    header: WebsiteNode[];
    footer: WebsiteNode[];
    activePageId: string | null;
    editingContext: 'page' | 'header' | 'footer';
    contentTree: WebsiteNode[];
    device: Device;
    selectedNodeIds: string[];
    onSelectPage: (id: string) => void;
    onSetEditingContext: (context: 'page' | 'header' | 'footer') => void;
    onCreatePage: () => void;
    onDuplicatePage: (id: string) => void;
    onDeletePage: (id: string) => void;
    onOpenPageSettings: (id: string) => void;
    onSelectNode: (id: string, e: React.MouseEvent) => void;
    onUpdateNode: (id: string, updates: Partial<WebsiteNode>) => void;
    onAddElement: (type: ElementType) => void;
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
        const handleClickOutside = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) onClose(); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={menuRef} className="absolute top-full right-0 bg-white dark:bg-slate-800 w-48 rounded-md shadow-lg text-sm py-1 z-10 border border-slate-200 dark:border-slate-700">
            <button onClick={() => { onSettings(); onClose(); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700"><SettingsIcon className="w-4 h-4" /> Settings</button>
            <button onClick={() => { onDuplicate(); onClose(); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700"><DuplicateIcon className="w-4 h-4" /> Duplicate</button>
            <div className="my-1 h-px bg-slate-200 dark:bg-slate-700"></div>
            <button onClick={() => { onDelete(); onClose(); }} className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"><TrashIcon className="w-4 h-4" /> Delete Page</button>
        </div>
    );
};

const PagesAndLayersPanel: React.FC<PagesAndLayersPanelProps> = (props) => {
    const [openKebabMenu, setOpenKebabMenu] = useState<string | null>(null);
    const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
    const [renamingText, setRenamingText] = useState('');
    const [collapsedLayers, setCollapsedLayers] = useState<Set<string>>(new Set());

    const handleStartRename = (id: string) => {
        const node = findNodeById(props.contentTree, id);
        if (node) {
            setRenamingNodeId(id);
            setRenamingText(node.customName || node.type);
        }
    };

    const handleCommitRename = () => {
        if (renamingNodeId) props.onUpdateNode(renamingNodeId, { customName: renamingText });
        setRenamingNodeId(null);
        setRenamingText('');
    };
    
    const onToggleCollapse = (id: string) => {
        setCollapsedLayers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };
    
    useEffect(() => {
        if (props.selectedNodeIds.length > 0) {
            const selectedId = props.selectedNodeIds[0];
            const path = findNodePath(props.contentTree, selectedId);
            if (path) {
                setCollapsedLayers(prev => {
                    const newSet = new Set(prev);
                    path.slice(0, -1).forEach(node => newSet.delete(node.id)); 
                    return newSet;
                });
            }
        }
    }, [props.selectedNodeIds, props.contentTree]);
    
    const layerItemProps = {
        device: props.device,
        selectedNodeIds: props.selectedNodeIds,
        renamingNodeId: renamingNodeId,
        renamingText: renamingText,
        collapsedLayers: collapsedLayers,
        onToggleCollapse: onToggleCollapse,
        onSelectNode: props.onSelectNode,
        onStartRename: handleStartRename,
        onSetRenamingText: setRenamingText,
        onCommitRename: handleCommitRename,
        onToggleVisibility: props.onToggleVisibility,
        onDragStart: props.onDragStart,
        onDragOver: props.onDragOver,
        onDragLeave: props.onDragLeave,
        onDrop: props.onDrop,
        dropTarget: props.dropTarget,
    };

    const handleSelectContext = (context: 'page' | 'header' | 'footer', pageId?: string) => {
        props.onSetEditingContext(context);
        if (context === 'page' && pageId) {
            props.onSelectPage(pageId);
        }
    };

    return (
        <aside className="editor-sidebar">
            <div className="panel-section">
                <div className="panel-header"><h4>Structure</h4><button onClick={props.onCreatePage} className="panel-header-button"><PlusIcon className="w-4 h-4" /></button></div>
                <div className="panel-content">
                    {/* Header */}
                    <div onClick={() => handleSelectContext('header')} className={`page-item ${props.editingContext === 'header' ? 'active' : ''}`}>Header</div>
                    {/* Pages */}
                    {props.pages.map(page => (
                        <div key={page.id} className={`page-item ${props.activePageId === page.id && props.editingContext === 'page' ? 'active' : ''}`}>
                            <div onClick={() => handleSelectContext('page', page.id)} className="flex-grow truncate">{page.name}{page.isHomepage && <span className="homepage-indicator">(H)</span>}</div>
                            <div className="relative">
                                <button onClick={(e) => { e.stopPropagation(); setOpenKebabMenu(openKebabMenu === page.id ? null : page.id); }} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700/50"><MoreVerticalIcon className="w-4 h-4" /></button>
                                {openKebabMenu === page.id && <PageKebabMenu page={page} onSettings={() => props.onOpenPageSettings(page.id)} onDuplicate={() => props.onDuplicatePage(page.id)} onDelete={() => props.onDeletePage(page.id)} onClose={() => setOpenKebabMenu(null)} />}
                            </div>
                        </div>
                    ))}
                    {/* Footer */}
                    <div onClick={() => handleSelectContext('footer')} className={`page-item ${props.editingContext === 'footer' ? 'active' : ''}`}>Footer</div>
                </div>
            </div>

            <div className="panel-section flex-grow flex flex-col">
                <div className="panel-header"><h4>Layers</h4><button onClick={() => props.onAddElement('headline')} className="panel-header-button"><PlusIcon className="w-4 h-4" /></button></div>
                <div className="panel-content flex-grow overflow-y-auto">
                    {props.contentTree.map(node => <LayerItem key={node.id} {...layerItemProps} node={node} />)}
                </div>
            </div>
        </aside>
    );
};

export default PagesAndLayersPanel;