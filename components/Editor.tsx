import React, { useState, useEffect, useCallback, useRef } from 'react';
import { produce } from 'immer';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { WebsiteData, WebsiteNode, Section, Session, ElementType, Device, ResponsiveStyles, Element, Page, StyleProperties, Column } from '../types';
import { findNodeById, updateNodeById, removeNodeById, addNode, moveNode, duplicateNodeById, findNodePath, deepCloneWithNewIds, addNodeNextTo, findNodeAndParent, isDropAllowed, createDefaultElement } from '../utils/tree';
import { generateSectionContent } from '../services/geminiService';
import StylePanel from './SectionEditorForm'; // This is now the Right Inspector
import Preview from './Preview';
import PublishModal from './PublishModal';
import { DesktopIcon, TabletIcon, MobileIcon, UndoIcon, RedoIcon, CommandIcon, PencilIcon } from './icons';
import ContextMenu from './ContextMenu';
import CommandPalette from './CommandPalette';
import PageSettingsModal from './PageSettingsModal';
import AssetManager from './AssetManager';
import PagesAndLayersPanel from './PagesAndLayersPanel'; // This is now the Left Sidebar
import { useDynamicStyles } from '../hooks/useDynamicStyles';

type EditingContext = 'page' | 'header' | 'footer';

// Custom hook for state management with undo/redo
const useHistoryState = <T,>(initialState: T) => {
    const [history, setHistory] = useState<{ state: T, message: string }[]>([{ state: initialState, message: 'Initial State' }]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const setState = (action: (draft: T) => void | T, message: string = 'Unknown Action') => {
        if (!history[currentIndex]?.state) return;
        const newState = produce(history[currentIndex].state, action as any);
        
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push({ state: newState, message });
        setHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
    };
    
    const setInitialState = (state: T) => {
        setHistory([{ state, message: 'Initial Load' }]);
        setCurrentIndex(0);
    }
    
    const jumpToState = (index: number) => {
        if (index >= 0 && index < history.length) {
            setCurrentIndex(index);
        }
    }

    const undo = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };
    const redo = () => { if (currentIndex < history.length - 1) setCurrentIndex(prev => prev + 1); };

    return {
        state: history[currentIndex]?.state,
        setState,
        setInitialState,
        undo,
        redo,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
        history,
        currentIndex,
        jumpToState,
    };
};

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};


const EditorTopBar: React.FC<{
  websiteName: string;
  device: Device;
  onSetDevice: (device: Device) => void;
  onPublish: () => void;
  saveStatus: string;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenCommandPalette: () => void;
}> = ({ websiteName, device, onSetDevice, onPublish, saveStatus, onUndo, onRedo, canUndo, canRedo, onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const deviceOptions: { id: Device; icon: React.FC<any> }[] = [ { id: 'desktop', icon: DesktopIcon }, { id: 'tablet', icon: TabletIcon }, { id: 'mobile', icon: MobileIcon } ];
  return (
    <div className="editor-top-bar">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-indigo-600"> &larr; </button>
        <h1 className="text-lg font-semibold text-slate-800">{websiteName}</h1>
      </div>
       <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
            <button onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"><UndoIcon className="w-5 h-5"/></button>
            <button onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"><RedoIcon className="w-5 h-5"/></button>
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-md">
            {deviceOptions.map(({ id, icon: Icon }) => ( <button key={id} onClick={() => onSetDevice(id)} className={`p-1.5 rounded ${device === id ? 'bg-white shadow' : 'text-slate-500 hover:bg-slate-100'}`} title={`Preview on ${id}`}> <Icon className="w-5 h-5" /> </button> ))}
        </div>
         <button onClick={onOpenCommandPalette} className="p-1.5 rounded text-slate-500 hover:bg-slate-100" title="Command Palette (Cmd+K)">
            <CommandIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs text-slate-500 h-4 min-w-[100px] text-right"> {saveStatus} </div>
        <button onClick={onPublish} className="bg-indigo-600 text-white font-bold py-1.5 px-4 rounded-md text-sm hover:bg-indigo-700"> Publish </button>
      </div>
    </div>
  );
};


const Editor: React.FC<{session: Session}> = ({ session }) => {
  const { websiteId } = useParams<{ websiteId: string }>();
  const { state: websiteData, setState: setWebsiteData, setInitialState: setInitialWebsiteData, undo, redo, canUndo, canRedo, history, currentIndex, jumpToState } = useHistoryState<WebsiteData | null>(null);
  const debouncedWebsiteData = useDebounce(websiteData, 2000);
  const isInitialLoad = useRef(true);
  
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [editingContext, setEditingContext] = useState<EditingContext>('page');
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);

  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ targetId: string; position: 'top' | 'bottom' } | null>(null);
  
  const activePage = websiteData?.pages.find(p => p.id === activePageId);
  const dynamicStyles = useDynamicStyles(websiteData, activePage || null);

  const contentTree = editingContext === 'page' ? activePage?.children : websiteData?.[editingContext];
  const selectedNodes = selectedNodeIds.map(id => findNodeById(contentTree || [], id)).filter(Boolean) as WebsiteNode[];
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const nodePath = contentTree && selectedNode ? findNodePath(contentTree, selectedNode.id) : [];

  const handleSetEditingContext = (context: EditingContext) => {
      setSelectedNodeIds([]);
      setEditingContext(context);
  }

  const handleSave = useCallback(async () => {
    if (!isDirty || !websiteData) return;
    setIsSaving(true);
    setSaveStatus('Saving...');
    try {
        await fetch('/api/editor-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ websiteId, websiteData })
        });
        setIsDirty(false);
        setSaveStatus(`Saved just now`);
    } catch (e) {
        console.error("Failed to save:", e);
        setSaveStatus('Save failed');
    } finally {
        setIsSaving(false);
        setTimeout(() => setSaveStatus(isDirty ? 'Unsaved changes' : 'All changes saved'), 2000);
    }
  }, [websiteId, websiteData, isDirty]);

  useEffect(() => {
    if (isInitialLoad.current) { isInitialLoad.current = false; return; }
    if (!debouncedWebsiteData || !isDirty) return;
    handleSave();
  }, [debouncedWebsiteData, handleSave, isDirty]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); } };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { if (isDirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, handleSave]);

  useEffect(() => {
    const loadData = async () => {
      if (!websiteId) { setError("No website ID provided."); return; }
      setError(null);
      try {
        const res = await fetch(`/api/editor-data?websiteId=${websiteId}`);
        if (res.ok) {
          const data = await res.json();
          setInitialWebsiteData(data);
          if (data.pages && data.pages.length > 0) {
            const homepage = data.pages.find((p: Page) => p.isHomepage) || data.pages[0];
            setActivePageId(homepage.id);
          }
        } else {
          throw new Error('Failed to load website data.');
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred.');
      }
    };
    loadData();
  }, [websiteId, setInitialWebsiteData]);
  
  const handleCloseContextMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
      window.addEventListener('click', handleCloseContextMenu);
      return () => { window.removeEventListener('click', handleCloseContextMenu); }
  }, [handleCloseContextMenu]);
  
   useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsCommandPaletteOpen(true); return; }
        const activeEl = document.activeElement;
        if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || (activeEl?.hasAttribute('contenteditable') && activeEl?.getAttribute('contenteditable') === 'true')) { return; }
        if (selectedNodeIds.length === 0) return;
        const selectedNodeId = selectedNodeIds[0];
        if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); handleDeleteNode(selectedNodeId); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds]);
  
  const handleContextMenuRequest = (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };
  
  const updateWebsiteData = (producer: (draft: WebsiteData) => void | WebsiteData, message: string) => {
    setWebsiteData(producer, message);
    setIsDirty(true);
    setSaveStatus('Unsaved changes');
  }

  const handleUpdateNode = useCallback((id: string, updates: Partial<WebsiteNode>) => {
    updateWebsiteData(draft => {
        const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext];
        if (tree) updateNodeById(tree, id, updates);
    }, `Update ${findNodeById(contentTree || [], id)?.type}`);
  }, [activePageId, editingContext, contentTree]);

  const handleDeleteNode = useCallback((id: string) => {
    let parentId: string | null = null;
    const tree = contentTree || [];
    const location = findNodeAndParent(tree, id);
    if (!location) return;

    if ('id' in location.parent) parentId = (location.parent as WebsiteNode).id;
    
    updateWebsiteData(draft => {
        const currentTree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext];
        if (currentTree && removeNodeById(currentTree, id)) {
            setSelectedNodeIds(parentId ? [parentId] : []);
            if (location.node.type === 'column' && 'children' in location.parent && 'type' in location.parent && location.parent.type === 'row') {
                const parentRow = findNodeById(currentTree, (location.parent as WebsiteNode).id) as any;
                if (parentRow && parentRow.children.length > 0) {
                    const basis = `${100 / parentRow.children.length}%`;
                    parentRow.children.forEach((col: Column) => {
                        if (!col.styles.desktop) col.styles.desktop = {};
                        col.styles.desktop.flexBasis = basis;
                    });
                }
            }
        }
    }, `Delete node`);
  }, [activePageId, editingContext, contentTree]);

  const handleAddElement = useCallback((type: ElementType) => {
    updateWebsiteData(draft => {
        if (!draft) return;
        const page = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId) : null;
        const container = editingContext === 'page' ? page : { children: draft[editingContext] };
        if (!container) return;
        
        let targetColumnId: string | null = null;
        let selectedNode: WebsiteNode | null = null;
        if (selectedNodeIds.length > 0) {
            selectedNode = findNodeById(container.children, selectedNodeIds[0]);
        }

        if (selectedNode) {
            if (selectedNode.type === 'column') targetColumnId = selectedNode.id;
            else if (selectedNode.type === 'row' || selectedNode.type === 'section') {
                const firstColumn = (selectedNode as any).children?.[0]?.children?.[0];
                if (firstColumn?.type === 'column') targetColumnId = firstColumn.id;
            }
        }
        
        if (!targetColumnId) {
            const newElement = createDefaultElement(type);
            const newColumn: Column = { id: uuidv4(), type: 'column', styles: { desktop: {flexBasis: '100%'}, tablet: {}, mobile: {} }, children: [newElement] };
            const newRow: WebsiteNode = { id: uuidv4(), type: 'row', styles: { desktop: {}, tablet: {}, mobile: {} }, children: [newColumn] };
            const newSection: Section = { id: uuidv4(), type: 'section', styles: { desktop: { paddingTop: '2rem', paddingBottom: '2rem'}, tablet: {}, mobile: {} }, children: [newRow as any] };
            container.children.push(newSection);
            setSelectedNodeIds([newElement.id]);
        } else {
            addNode(container, targetColumnId, type);
        }
        if (editingContext !== 'page') draft[editingContext] = container.children as Section[];
    }, `Add ${type} element`);
  }, [selectedNodeIds, activePageId, editingContext]);
  
  const handleSelectNode = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeIds([id]);
  }, []);

  const handleMoveNode = useCallback((sourceId: string, targetId: string, position: 'top' | 'bottom') => {
      updateWebsiteData(draft => {
          const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext];
          if (tree) moveNode(tree, sourceId, targetId, position === 'top' ? 'before' : 'after');
      }, `Move Node`);
  }, [editingContext, activePageId]);

  const handleDuplicateNode = useCallback((nodeId: string) => updateWebsiteData(draft => { const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext]; if (tree) duplicateNodeById(tree, nodeId); }, `Duplicate node`), [editingContext, activePageId]);
  const handleToggleVisibility = useCallback((nodeId: string) => { const node = findNodeById(contentTree || [], nodeId); if (node) { const currentVisibility = node.visibility || {}; const isVisible = currentVisibility[device] !== false; handleUpdateNode(nodeId, { visibility: { ...currentVisibility, [device]: !isVisible } }); } }, [contentTree, device, handleUpdateNode]);

    const handleCreatePage = () => {
        const name = prompt("Enter new page name:", "New Page");
        if (!name) return;
        const newPage: Page = {
            id: uuidv4(), name, slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''), isHomepage: false, children: [], heroImageUrl: 'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?q=80&w=2071&auto=format&fit=crop', tagline: 'A brand new page'
        };
        updateWebsiteData(draft => { draft.pages.push(newPage); }, "Create Page");
        setActivePageId(newPage.id);
        setSelectedNodeIds([]);
    };

    const handleDuplicatePage = (pageId: string) => {
        updateWebsiteData(draft => {
            const pageToDuplicate = draft.pages.find(p => p.id === pageId);
            if (pageToDuplicate) {
                const newPage = deepCloneWithNewIds(pageToDuplicate) as Page;
                newPage.name = `${pageToDuplicate.name} (Copy)`; newPage.slug = `${pageToDuplicate.slug}-copy`; newPage.isHomepage = false;
                draft.pages.push(newPage);
                setActivePageId(newPage.id);
                setSelectedNodeIds([]);
            }
        }, "Duplicate Page");
    };

    const handleDeletePage = (pageId: string) => {
        if (!window.confirm("Are you sure? This cannot be undone.")) return;
        updateWebsiteData(draft => {
            if (draft.pages.length <= 1) { alert("You cannot delete the last page."); return; }
            const index = draft.pages.findIndex(p => p.id === pageId);
            if (index > -1) {
                const wasHomepage = draft.pages[index].isHomepage;
                draft.pages.splice(index, 1);
                if (wasHomepage && draft.pages.length > 0) draft.pages[0].isHomepage = true;
                setActivePageId(draft.pages[0].id);
                setSelectedNodeIds([]);
            }
        }, "Delete Page");
    };

    const handleOpenPageSettings = (pageId: string) => {
        const page = websiteData?.pages.find(p => p.id === pageId);
        if (page) setEditingPage(page);
    };

    const handleDragStart = (e: React.DragEvent, nodeId: string) => { e.dataTransfer.effectAllowed = 'move'; setDraggedNodeId(nodeId); };
    const handleDragOver = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedNodeId || draggedNodeId === targetId) return;
      const sourceNode = findNodeById(contentTree || [], draggedNodeId);
      const targetLocation = findNodeAndParent(contentTree || [], targetId);
      if (!sourceNode || !targetLocation) { if (dropTarget) setDropTarget(null); return; }
      const targetParentType = 'type' in targetLocation.parent ? (targetLocation.parent as WebsiteNode).type : 'page';
      if (isDropAllowed(sourceNode.type, targetParentType)) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const position: 'top' | 'bottom' = e.clientY - rect.top < rect.height / 2 ? 'top' : 'bottom';
        if (dropTarget?.targetId !== targetId || dropTarget?.position !== position) setDropTarget({ targetId, position });
      } else { if (dropTarget) setDropTarget(null); }
    };
    const handleDragLeave = () => setDropTarget(null);
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); if (draggedNodeId && dropTarget) handleMoveNode(draggedNodeId, dropTarget.targetId, dropTarget.position); setDraggedNodeId(null); setDropTarget(null); };
    
    // FEAT: AI Function Implementations
    const handleGenerateSection = useCallback(async (sectionId: string) => {
        if (!websiteData || !activePage) return;
        setGeneratingSectionId(sectionId);
        try {
            const section = findNodeById(contentTree || [], sectionId) as Section;
            if (!section) throw new Error("Section not found");

            const generatedElementsInColumns = await generateSectionContent(websiteData, activePage.tagline || '', section);

            updateWebsiteData(draft => {
                const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext];
                const draftSection = findNodeById(tree || [], sectionId) as Section;
                if (draftSection) {
                    const columns = draftSection.children.flatMap(row => row.children);
                    columns.forEach((column, index) => {
                        const newElements = (generatedElementsInColumns[index] || []).map((el: any) => ({
                            ...createDefaultElement(el.type as ElementType),
                            id: uuidv4(),
                            content: el.content,
                        }));
                        column.children = newElements;
                    });
                }
            }, 'Generate Section Content');

        } catch (e) {
            console.error("Failed to generate section content:", e);
            alert(e instanceof Error ? e.message : 'AI generation failed.');
        } finally {
            setGeneratingSectionId(null);
        }
    }, [websiteData, activePage, activePageId, editingContext, contentTree, updateWebsiteData]);


    const handleAiTextUpdate = useCallback(async (nodeId: string, action: string, options?: { tone?: string }) => {
        if (!websiteData) return;
        setIsAiLoading(true);
        try {
            const node = findNodeById(contentTree || [], nodeId);
            const text = (node as any)?.content?.text;
            if (!node || typeof text === 'undefined') {
                throw new Error('Node with text content not found.');
            }

            const res = await fetch('/api/ai-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, action, ...options }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'AI text generation failed.');
            }
            const { newText } = await res.json();
            handleUpdateNode(nodeId, { content: { ...(node as any).content, text: newText } });

        } catch (e) {
            console.error("AI Text Update failed:", e);
            alert(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsAiLoading(false);
        }
    }, [websiteData, contentTree, handleUpdateNode]);


    if (!websiteData || !activePage) return <div className="editor-container items-center justify-center"><div className="dashboard-spinner"></div></div>;
    if (error) return <div className="p-4 text-red-600">{error}</div>;

    return (
        <div className="editor-container">
            <style>{dynamicStyles}</style>
            <EditorTopBar websiteName={websiteData.name} device={device} onSetDevice={setDevice} onPublish={() => setIsPublishModalOpen(true)} saveStatus={saveStatus} onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo} onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
            
            <main className="editor-main-grid">
                <PagesAndLayersPanel
                    pages={websiteData.pages}
                    header={websiteData.header}
                    footer={websiteData.footer}
                    activePageId={activePageId}
                    editingContext={editingContext}
                    contentTree={contentTree || []}
                    device={device}
                    selectedNodeIds={selectedNodeIds}
                    onSelectPage={setActivePageId}
                    onSetEditingContext={handleSetEditingContext}
                    onCreatePage={handleCreatePage}
                    onDuplicatePage={handleDuplicatePage}
                    onDeletePage={handleDeletePage}
                    onOpenPageSettings={handleOpenPageSettings}
                    onSelectNode={handleSelectNode}
                    onUpdateNode={handleUpdateNode}
                    onAddElement={handleAddElement}
                    onToggleVisibility={handleToggleVisibility}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    dropTarget={dropTarget}
                />

                <div className="editor-canvas-wrapper" onClick={() => setSelectedNodeIds([])}>
                    <div className={`preview-canvas-container preview-canvas-${device}`}>
                        <Preview websiteData={websiteData} activePage={activePage} interactive device={device} selectedNodeId={selectedNodeIds[0]} selectedNodeIds={selectedNodeIds} hoveredNodeId={hoveredNodeId} onSelectNode={handleSelectNode} onHoverNode={setHoveredNodeId} onUpdateNode={handleUpdateNode} onAiTextUpdate={handleAiTextUpdate} isAiLoading={isAiLoading} onContextMenuRequest={handleContextMenuRequest} onAddSection={()=>{}} onGenerateSection={handleGenerateSection} generatingSectionId={generatingSectionId} />
                    </div>
                </div>
                
                <StylePanel
                    key={selectedNode ? selectedNode.id : 'global'}
                    node={selectedNode}
                    nodePath={nodePath || []}
                    websiteData={websiteData}
                    setWebsiteData={updateWebsiteData}
                    activePage={activePage}
                    onUpdateNode={handleUpdateNode}
                    onOpenAssetManager={() => setIsAssetManagerOpen(true)}
                    onSelectNode={(id) => setSelectedNodeIds([id])}
                    device={device}
                />
            </main>

            {isPublishModalOpen && session.username && <PublishModal username={session.username} websiteData={websiteData} onClose={() => setIsPublishModalOpen(false)} onPublishSuccess={(d) => { /* Can update state if needed */ }} />}
            {editingPage && <PageSettingsModal page={editingPage} onClose={() => setEditingPage(null)} onSave={(updates) => updateWebsiteData(draft => { const p = draft.pages.find(p => p.id === editingPage!.id); if (p) Object.assign(p, updates); }, 'Update page settings')} />}
            {isAssetManagerOpen && <AssetManager websiteData={websiteData} onClose={() => setIsAssetManagerOpen(false)} onUpdateAssets={(newAssets) => updateWebsiteData(draft => { draft.assets = newAssets; }, 'Update Assets')} onSelectAsset={(url) => { if (selectedNode) { handleUpdateNode(selectedNode.id, { styles: { desktop: { backgroundImage: `url(${url})` }, tablet: {}, mobile: {}}}); setIsAssetManagerOpen(false); } }} />}
            {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} nodeId={contextMenu.nodeId} onClose={handleCloseContextMenu} onDuplicate={() => handleDuplicateNode(contextMenu.nodeId)} onDelete={() => handleDeleteNode(contextMenu.nodeId)} onCopyStyles={() => {}} onPasteStyles={() => {}} onCopyNode={() => {}} onPasteNode={() => {}} onToggleLock={() => {}} canPasteStyles={false} canPasteNode={false} node={findNodeById(contentTree || [], contextMenu.nodeId)} />}
            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} commands={[]} />
        </div>
    );
};
export default Editor;