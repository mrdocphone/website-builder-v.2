
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { produce } from 'immer';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { WebsiteData, WebsiteNode, Section, Session, ElementType, Device, ResponsiveStyles, Element, Page, StyleProperties, Column } from '../types';
// FIX: Added isDropAllowed to check drag-and-drop validity.
import { findNodeById, updateNodeById, removeNodeById, addNode, moveNode, duplicateNodeById, findNodePath, deepCloneWithNewIds, addNodeNextTo, findNodeAndParent, isDropAllowed } from '../utils/tree';
import { generateSectionContent } from '../services/geminiService';
import GlobalSettingsForm from './GlobalSettingsForm';
import StylePanel from './SectionEditorForm';
import Preview from './Preview';
import PublishModal from './PublishModal';
import { DesktopIcon, TabletIcon, MobileIcon, LayersIcon, PlusIcon as ComponentIcon, SettingsIcon, PencilIcon, TrashIcon, VideoIcon, StarIcon, CheckIcon, HeartIcon, UndoIcon, RedoIcon, CopyIcon, PasteIcon, FormIcon, EmbedIcon, MagicWandIcon, HomeIcon, PageSettingsIcon, DuplicateIcon, ColumnIcon, LockIcon, UnlockIcon, LayoutIcon, SunIcon, MoonIcon, CommandIcon, AssetIcon, WireframeIcon, HistoryIcon, PlusIcon, AlignTopIcon, AlignCenterVerticalIcon, AlignBottomIcon, DistributeVerticalIcon } from './icons';
import ContextMenu from './ContextMenu';
import SectionTemplatesPanel from './SectionTemplatesPanel';
import PageSettingsModal from './PageSettingsModal';
import AssetManager from './AssetManager';
import PagesAndLayersPanel from './PagesAndLayersPanel';
import { useDynamicStyles } from '../hooks/useDynamicStyles';

type DropPosition = 'top' | 'bottom';
type EditingContext = 'page' | 'header' | 'footer';

// Custom hook for state management with undo/redo
const useHistoryState = <T,>(initialState: T) => {
    const [history, setHistory] = useState<{ state: T, message: string }[]>([{ state: initialState, message: 'Initial State' }]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const setState = (action: (draft: T) => void | T, message: string = 'Unknown Action', fromHistory = false) => {
        if (!history[currentIndex]?.state) return;
        const newState = produce(history[currentIndex].state, action as any);
        if (fromHistory) {
            setHistory(currentHistory => [...currentHistory, { state: newState, message }]);
            setCurrentIndex(history.length);
        } else {
            const newHistory = history.slice(0, currentIndex + 1);
            newHistory.push({ state: newState, message });
            setHistory(newHistory);
            setCurrentIndex(newHistory.length - 1);
        }
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
    // FIX: Redo was incorrectly decrementing the index instead of incrementing it.
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
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


//================================================================================================
// SUB-COMPONENTS
//================================================================================================

const EditorTopBar: React.FC<{
  websiteName: string;
  device: Device;
  editingContext: EditingContext;
  onSetDevice: (device: Device) => void;
  onSetEditingContext: (context: EditingContext) => void;
  onPublish: () => void;
  isSaving: boolean;
  saveStatus: string;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenCommandPalette: () => void;
}> = ({ websiteName, device, editingContext, onSetDevice, onSetEditingContext, onPublish, isSaving, saveStatus, onUndo, onRedo, canUndo, canRedo, onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const deviceOptions: { id: Device; icon: React.FC<any> }[] = [ { id: 'desktop', icon: DesktopIcon }, { id: 'tablet', icon: TabletIcon }, { id: 'mobile', icon: MobileIcon } ];
  return (
    <div className="editor-top-bar">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-indigo-600"> &larr; Back </button>
        <h1 className="text-lg font-semibold text-slate-800">{websiteName}</h1>
         {editingContext !== 'page' && (
             <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-md">
                    Editing {editingContext.charAt(0).toUpperCase() + editingContext.slice(1)}
                 </span>
                 <button onClick={() => onSetEditingContext('page')} className="text-sm text-slate-500 hover:underline">Exit</button>
             </div>
         )}
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

const AddPanel: React.FC<{ onAddElement: (type: ElementType) => void }> = ({ onAddElement }) => {
  const elements: { type: ElementType, label: string, icon: React.FC<any> }[] = [ { type: 'headline', label: 'Headline', icon: PencilIcon }, { type: 'text', label: 'Text', icon: PencilIcon }, { type: 'button', label: 'Button', icon: PencilIcon }, { type: 'image', label: 'Image', icon: PencilIcon }, { type: 'spacer', label: 'Spacer', icon: CheckIcon }, { type: 'video', label: 'Video', icon: VideoIcon }, { type: 'icon', label: 'Icon', icon: StarIcon }, { type: 'form', label: 'Form', icon: FormIcon }, { type: 'embed', label: 'Embed', icon: EmbedIcon }, { type: 'navigation', label: 'Navigation', icon: MagicWandIcon }, { type: 'gallery', label: 'Gallery', icon: MagicWandIcon }, { type: 'divider', label: 'Divider', icon: MagicWandIcon }, { type: 'map', label: 'Map', icon: MagicWandIcon }, { type: 'accordion', label: 'Accordion', icon: MagicWandIcon }, { type: 'tabs', label: 'Tabs', icon: MagicWandIcon }, { type: 'socialIcons', label: 'Social Icons', icon: MagicWandIcon }];
  return ( <div className="add-element-grid"> {elements.map(el => ( <button key={el.type} onClick={() => onAddElement(el.type)} className="add-element-button"> <el.icon className="w-6 h-6" /> <span>{el.label}</span> </button> ))} </div> );
};

//================================================================================================
// EDITOR MAIN COMPONENT
//================================================================================================
const Editor: React.FC<{session: Session}> = ({ session }) => {
  const { websiteId } = useParams<{ websiteId: string }>();
  const { state: websiteData, setState: setWebsiteData, setInitialState: setInitialWebsiteData, undo, redo, canUndo, canRedo, history, currentIndex, jumpToState } = useHistoryState<WebsiteData | null>(null);
  const debouncedWebsiteData = useDebounce(websiteData, 2000);
  const isInitialLoad = useRef(true);
  
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  
  // NEW: Refined saving state
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pages' | 'add' | 'templates' | 'style' | 'settings' | 'history'>('pages');
  const [device, setDevice] = useState<Device>('desktop');
  const [editingContext, setEditingContext] = useState<EditingContext>('page');
  const [copiedStyles, setCopiedStyles] = useState<ResponsiveStyles | null>(null);
  const [copiedNode, setCopiedNode] = useState<WebsiteNode | null>(null);
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [editorTheme, setEditorTheme] = useState<'light' | 'dark'>('light');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'normal' | 'wireframe'>('normal');

  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ targetId: string; position: DropPosition } | null>(null);
  
  // NEW: State for alignment toolbar
  const [alignmentToolbarState, setAlignmentToolbarState] = useState<{ top: number; left: number; width: number } | null>(null);

  const activePage = websiteData?.pages.find(p => p.id === activePageId);
  const dynamicStyles = useDynamicStyles(websiteData, activePage || null);

  const contentTree = editingContext === 'page' ? activePage?.children : websiteData?.[editingContext];
  const selectedNodes = selectedNodeIds.map(id => findNodeById(contentTree || [], id)).filter(Boolean) as WebsiteNode[];
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;

  const handleSetEditingContext = (context: EditingContext) => {
      setSelectedNodeIds([]); // FIX: Clear selection when changing context to prevent errors.
      setEditingContext(context);
  }

  // NEW: Save function
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

  // NEW: Autosave effect based on debounced data
  useEffect(() => {
    if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
    }
    if (!debouncedWebsiteData || !isDirty) return;
    handleSave();
  }, [debouncedWebsiteData, handleSave, isDirty]);

  // NEW: Manual save and unload listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 's') {
            e.preventDefault();
            handleSave();
        }
    };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isDirty) {
            e.preventDefault();
            e.returnValue = ''; // Required for cross-browser support
        }
    };
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
      window.addEventListener('contextmenu', handleCloseContextMenu);
      return () => {
          window.removeEventListener('click', handleCloseContextMenu);
          window.removeEventListener('contextmenu', handleCloseContextMenu);
      }
  }, [handleCloseContextMenu]);
  
   useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsCommandPaletteOpen(true);
            return;
        }

        const activeEl = document.activeElement;
        // FIX: Prevent shortcuts when any input/textarea is focused, not just contenteditable.
        if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || (activeEl?.hasAttribute('contenteditable') && activeEl?.getAttribute('contenteditable') === 'true')) {
            return;
        }

        if (selectedNodeIds.length === 0) return;
        const selectedNodeId = selectedNodeIds[0];

        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            handleDeleteNode(selectedNodeId);
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); handleDuplicateNode(selectedNodeId); }
        if ((e.metaKey || e.ctrlKey) && e.key === 'c') { e.preventDefault(); handleCopyNode(selectedNodeId); }
        if ((e.metaKey || e.ctrlKey) && e.key === 'v') { e.preventDefault(); handlePasteNode(selectedNodeId); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds]);
  
  
  const handleContextMenuRequest = (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };
  
  // Wrapped setState to handle dirty flag
  const updateWebsiteData = (action: (draft: WebsiteData) => void | WebsiteData, message: string) => {
    setWebsiteData(draft => {
        if (draft) return action(draft) as any;
    }, message);
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
             // After removing, if the deleted node was a column, resize siblings
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
    if (selectedNodeIds.length !== 1) { alert("Please select a single column to add the element to."); return; }
    
    updateWebsiteData(draft => {
        let container: { children: WebsiteNode[] };
        if (editingContext === 'page') {
            const page = draft.pages.find(p => p.id === activePageId);
            if (!page) return;
            container = page;
        } else {
            container = { children: draft[editingContext] };
        }

        const parentNode = findNodeById(container.children, selectedNodeIds[0]);
        const targetParentId = (parentNode && parentNode.type === 'column') ? parentNode.id : null;
        
        if (targetParentId) {
            addNode(container, targetParentId, type);
            if (editingContext !== 'page') draft[editingContext] = container.children as Section[];
        } else {
            alert("Elements can only be added inside columns.");
        }
    }, `Add ${type} element`);
  }, [selectedNodeIds, activePageId, editingContext]);
  
  const handleAddSection = useCallback((context: 'page' | 'header' | 'footer') => {
      updateWebsiteData(draft => {
          const target = context === 'page' ? draft.pages.find(p => p.id === activePageId) : draft;
          if (!target) return;
          const newSection: Section = { id: uuidv4(), type: 'section', styles: { desktop: { paddingTop: '2rem', paddingBottom: '2rem'}, tablet: {}, mobile: {} }, children: [ { id: uuidv4(), type: 'row', styles: { desktop: {}, tablet: {}, mobile: {} }, children: [{ id: uuidv4(), type: 'column', styles: { desktop: {flexBasis: '100%'}, tablet: {}, mobile: {} }, children: [] }] } ] };
          target[context === 'page' ? 'children' : context].push(newSection);
          setSelectedNodeIds([newSection.id]);
          setActiveTab('style');
      }, `Add Section`);
  }, [activePageId]);

  const handleSelectNode = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.shiftKey) {
        setSelectedNodeIds(prev => prev.includes(id) ? prev.filter(nid => nid !== id) : [...prev, id]);
    } else {
        setSelectedNodeIds([id]);
    }
    setActiveTab('style');
  }, []);
  
  const handleMoveNode = useCallback((sourceId: string, targetId: string, position: 'top' | 'bottom') => {
      updateWebsiteData(draft => {
          const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext];
          if (tree) moveNode(tree, sourceId, targetId, position === 'top' ? 'before' : 'after');
      }, `Move Node`);
  }, [editingContext, activePageId]);
  
  const handleCopyStyles = (nodeId: string) => { if (contentTree) { const node = findNodeById(contentTree, nodeId); if (node) setCopiedStyles(node.styles); } };
  const handlePasteStyles = (nodeId: string) => { if (copiedStyles) handleUpdateNode(nodeId, { styles: copiedStyles }); };
  const handleCopyNode = (nodeId: string) => { if (contentTree) { const node = findNodeById(contentTree, nodeId); if (node) setCopiedNode(node); } };
  const handlePasteNode = (targetNodeId: string) => { if (copiedNode) updateWebsiteData(draft => { const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext]; if (tree) addNodeNextTo(tree, targetNodeId, deepCloneWithNewIds(copiedNode), 'after'); }, `Paste Node`); };
  const handleDuplicateNode = useCallback((nodeId: string) => updateWebsiteData(draft => { const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext]; if (tree) duplicateNodeById(tree, nodeId); }, `Duplicate node`), [editingContext, activePageId]);
  const handleToggleLock = (nodeId: string) => { if (contentTree) { const node = findNodeById(contentTree, nodeId); if (node) handleUpdateNode(nodeId, { locked: !node.locked }); } }
  const handleToggleVisibility = useCallback((nodeId: string) => { const node = findNodeById(contentTree || [], nodeId); if (node) { const currentVisibility = node.visibility || {}; const isVisible = currentVisibility[device] !== false; handleUpdateNode(nodeId, { visibility: { ...currentVisibility, [device]: !isVisible } }); } }, [contentTree, device, handleUpdateNode]);

    // NEW: Page Management handlers
    const handleCreatePage = () => {
        const name = prompt("Enter new page name:", "New Page");
        if (!name) return;
        updateWebsiteData(draft => {
            const newPage: Page = {
                id: uuidv4(),
                name,
                slug: name.toLowerCase().replace(/\s+/g, '-'),
                isHomepage: false,
                children: [],
                heroImageUrl: 'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?q=80&w=2071&auto=format&fit=crop',
                tagline: 'A brand new page'
            };
            draft.pages.push(newPage);
            setActivePageId(newPage.id);
            setSelectedNodeIds([]);
        }, "Create Page");
    };

    const handleDuplicatePage = (pageId: string) => {
        updateWebsiteData(draft => {
            const pageToDuplicate = draft.pages.find(p => p.id === pageId);
            if (pageToDuplicate) {
                const newPage = deepCloneWithNewIds(pageToDuplicate) as Page;
                newPage.name = `${pageToDuplicate.name} (Copy)`;
                newPage.slug = `${pageToDuplicate.slug}-copy`;
                newPage.isHomepage = false; // Prevent duplicate homepages
                draft.pages.push(newPage);
                setActivePageId(newPage.id);
                setSelectedNodeIds([]);
            }
        }, "Duplicate Page");
    };

    const handleDeletePage = (pageId: string) => {
        if (!window.confirm("Are you sure you want to delete this page? This cannot be undone.")) return;
        updateWebsiteData(draft => {
            if (draft.pages.length <= 1) {
                alert("You cannot delete the last page.");
                return;
            }
            const index = draft.pages.findIndex(p => p.id === pageId);
            if (index > -1) {
                const wasHomepage = draft.pages[index].isHomepage;
                draft.pages.splice(index, 1);
                if (wasHomepage && draft.pages.length > 0) {
                    draft.pages[0].isHomepage = true;
                }
                setActivePageId(draft.pages[0].id);
                setSelectedNodeIds([]);
            }
        }, "Delete Page");
    };

    const handleOpenPageSettings = (pageId: string) => {
        const page = websiteData?.pages.find(p => p.id === pageId);
        if (page) setEditingPage(page);
    };


  const handleAiTextUpdate = async (nodeId: string, action: string, options?: { tone?: string }) => {
      if (!activePage) return;
      const node = findNodeById(contentTree || [], nodeId) as Element;
      if (!node || !('content' in node) || !('text' in node.content)) return;
      const htmlContent = (node.content as any).text;
      setIsAiLoading(true);
      try {
          const res = await fetch('/api/ai-text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: htmlContent, action, ...options }) });
          const data = await res.json();
          if (res.ok) handleUpdateNode(nodeId, { content: { ...node.content, text: data.newText }});
          else throw new Error(data.message || 'AI request failed');
      } catch (e) { alert(e instanceof Error ? e.message : 'An error occurred.'); } 
      finally { setIsAiLoading(false); }
  }

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, nodeId: string) => { e.dataTransfer.effectAllowed = 'move'; setDraggedNodeId(nodeId); };
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedNodeId || draggedNodeId === targetId) return;

      const sourceNode = findNodeById(contentTree || [], draggedNodeId);
      const targetLocation = findNodeAndParent(contentTree || [], targetId);
      if (!sourceNode || !targetLocation) {
          if (dropTarget) setDropTarget(null);
          return;
      }
      const targetParentType = 'type' in targetLocation.parent ? (targetLocation.parent as WebsiteNode).type : 'page';

      if (isDropAllowed(sourceNode.type, targetParentType)) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const position: DropPosition = e.clientY - rect.top < rect.height / 2 ? 'top' : 'bottom';
        if (dropTarget?.targetId !== targetId || dropTarget?.position !== position) {
            setDropTarget({ targetId, position });
        }
      } else {
          if (dropTarget) setDropTarget(null);
      }
  };
  const handleDragLeave = () => setDropTarget(null);
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); if (draggedNodeId && dropTarget) handleMoveNode(draggedNodeId, dropTarget.targetId, dropTarget.position); setDraggedNodeId(null); setDropTarget(null); };

  // NEW: Multi-select alignment logic
  const handleAlign = (alignment: 'flex-start' | 'center' | 'flex-end' | 'stretch') => {
    updateWebsiteData(draft => {
        const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext];
        if (!tree) return;
        selectedNodeIds.forEach(id => {
            updateNodeById(tree, id, { styles: { desktop: { alignSelf: alignment }, tablet: {}, mobile: {} } });
        });
    }, `Align items ${alignment}`);
  };

  useEffect(() => {
    if (selectedNodes.length > 1) {
        const parent = findNodeAndParent(contentTree || [], selectedNodes[0].id)?.parent;
        const allInSameParent = selectedNodes.every(node => findNodeAndParent(contentTree || [], node.id)?.parent === parent);
        
        if (allInSameParent) {
            const firstNodeEl = document.querySelector(`[data-node-id="${selectedNodes[0].id}"]`) as HTMLElement;
            if (firstNodeEl) {
                const rect = firstNodeEl.getBoundingClientRect();
                const previewWrapper = document.querySelector('.editor-preview-wrapper');
                const scrollTop = previewWrapper?.scrollTop || 0;
                setAlignmentToolbarState({ top: rect.top + scrollTop - 50, left: rect.left, width: rect.width });
            }
        } else {
            setAlignmentToolbarState(null);
        }
    } else {
        setAlignmentToolbarState(null);
    }
  }, [selectedNodeIds, contentTree]);
  
  const handleSetActiveTab = (tab: any) => {
    // UX Improvement: If switching to 'add' tab and selected node is not a column, select its parent.
    if (tab === 'add' && selectedNode && selectedNode.type !== 'column') {
        const location = findNodeAndParent(contentTree || [], selectedNode.id);
        if (location && 'id' in location.parent) {
            setSelectedNodeIds([(location.parent as WebsiteNode).id]);
        }
    }
    setActiveTab(tab);
  }

  if (!websiteData || !activePage) return <div className="editor-container items-center justify-center"><div className="dashboard-spinner"></div></div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  const nodePath = contentTree && selectedNode ? findNodePath(contentTree, selectedNode.id) : [];

  return (
    <div className={`editor-container ${editorTheme === 'dark' ? 'dark-mode' : ''}`}>
      <style>{dynamicStyles}</style>
      <EditorTopBar websiteName={websiteData.name} device={device} editingContext={editingContext} onSetDevice={setDevice} onSetEditingContext={handleSetEditingContext} onPublish={() => setIsPublishModalOpen(true)} isSaving={isSaving} saveStatus={saveStatus} onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo} onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
      <div className="editor-main">
        <aside className="editor-sidebar">
           <div className="sidebar-tabs">{[{id: 'pages', icon: LayersIcon, label: 'Pages'}, {id: 'add', icon: ComponentIcon, label: 'Add'}, {id: 'history', icon: HistoryIcon, label: 'History'}, {id: 'style', icon: SettingsIcon, label: 'Style'}, {id: 'settings', icon: SettingsIcon, label: 'Global'}].map(tab => (<button key={tab.id} onClick={() => handleSetActiveTab(tab.id as any)} className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`} disabled={tab.id === 'style' && selectedNodeIds.length === 0}><tab.icon className="w-5 h-5" /> {tab.label}</button>))}</div>
           <div className="sidebar-content">
             {activeTab === 'pages' && (
                <PagesAndLayersPanel
                    pages={websiteData.pages}
                    activePageId={activePageId}
                    contentTree={contentTree || []}
                    device={device}
                    selectedNodeIds={selectedNodeIds}
                    onSelectPage={setActivePageId}
                    onCreatePage={handleCreatePage}
                    onDuplicatePage={handleDuplicatePage}
                    onDeletePage={handleDeletePage}
                    onOpenPageSettings={handleOpenPageSettings}
                    onSelectNode={handleSelectNode}
                    onUpdateNode={handleUpdateNode}
                    onToggleVisibility={handleToggleVisibility}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    dropTarget={dropTarget}
                />
             )}
             {activeTab === 'add' && <AddPanel onAddElement={handleAddElement} />}
             {activeTab === 'history' && (<div>{history.slice().reverse().map((item, index) => <div key={history.length - 1 - index} onClick={() => jumpToState(history.length - 1 - index)} className={`history-item ${history.length - 1 - index === currentIndex ? 'active' : ''}`}>{item.message}</div>)}</div>)}
             {activeTab === 'style' && selectedNode && ( <StylePanel key={selectedNode.id} node={selectedNode} nodePath={nodePath || []} onSelectNode={(id) => setSelectedNodeIds([id])} websiteData={websiteData} onUpdate={handleUpdateNode} onOpenAssetManager={() => setIsAssetManagerOpen(true)} device={device} /> )}
             {activeTab === 'settings' && <GlobalSettingsForm websiteData={websiteData} setWebsiteData={updateWebsiteData} onAddSection={handleAddSection} onSetEditingContext={setEditingContext} />}
          </div>
           <div className="p-2 border-t flex items-center justify-between"><button onClick={() => setViewMode(v => v === 'normal' ? 'wireframe' : 'normal')}><WireframeIcon/></button><button onClick={() => setIsAssetManagerOpen(true)}><AssetIcon/></button><button onClick={() => setEditorTheme(t => t === 'light' ? 'dark' : 'light')}>{editorTheme === 'light' ? <MoonIcon/> : <SunIcon/>}</button></div>
        </aside>
        <main className={`editor-preview-wrapper ${viewMode === 'wireframe' ? 'wireframe-mode' : ''}`} onClick={() => setSelectedNodeIds([])}>
             {alignmentToolbarState && (
                <div className="alignment-toolbar" style={{ top: alignmentToolbarState.top, left: alignmentToolbarState.left }}>
                    <button onClick={() => handleAlign('flex-start')} title="Align Top"><AlignTopIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleAlign('center')} title="Align Center"><AlignCenterVerticalIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleAlign('flex-end')} title="Align Bottom"><AlignBottomIcon className="w-5 h-5" /></button>
                    <button onClick={() => handleAlign('stretch')} title="Stretch to Fill"><DistributeVerticalIcon className="w-5 h-5" /></button>
                </div>
             )}
            <div className={`preview-canvas preview-canvas-${device}`}>
                <Preview websiteData={websiteData} activePage={activePage} interactive device={device} selectedNodeId={selectedNodeIds[0]} selectedNodeIds={selectedNodeIds} hoveredNodeId={hoveredNodeId} onSelectNode={handleSelectNode} onHoverNode={setHoveredNodeId} onUpdateNode={handleUpdateNode} onAiTextUpdate={handleAiTextUpdate} isAiLoading={isAiLoading} onContextMenuRequest={handleContextMenuRequest} onAddSection={handleAddSection}/>
            </div>
        </main>
      </div>
      {isPublishModalOpen && session.username && <PublishModal username={session.username} websiteData={websiteData} onClose={() => setIsPublishModalOpen(false)} onPublishSuccess={(d) => { /* Can update state if needed */ }} />}
      {editingPage && <PageSettingsModal page={editingPage} onClose={() => setEditingPage(null)} onSave={(updates) => updateWebsiteData(draft => { const p = draft.pages.find(p => p.id === editingPage.id); if (p) Object.assign(p, updates); }, 'Update page settings')} />}
       {isAssetManagerOpen && <AssetManager websiteData={websiteData} onClose={() => setIsAssetManagerOpen(false)} onUpdateAssets={(newAssets) => updateWebsiteData(draft => { draft.assets = newAssets; }, 'Update Assets')} onSelectAsset={(url) => { if (selectedNode) { handleUpdateNode(selectedNode.id, { styles: { desktop: { backgroundImage: `url(${url})` }, tablet: {}, mobile: {}}}); setIsAssetManagerOpen(false); } }} />}
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} nodeId={contextMenu.nodeId} onClose={handleCloseContextMenu} onDuplicate={() => handleDuplicateNode(contextMenu.nodeId)} onDelete={() => handleDeleteNode(contextMenu.nodeId)} onCopyStyles={() => handleCopyStyles(contextMenu.nodeId)} onPasteStyles={() => handlePasteStyles(contextMenu.nodeId)} onCopyNode={() => handleCopyNode(contextMenu.nodeId)} onPasteNode={() => handlePasteNode(contextMenu.nodeId)} onToggleLock={() => handleToggleLock(contextMenu.nodeId)} canPasteStyles={!!copiedStyles} canPasteNode={!!copiedNode} node={findNodeById(contentTree || [], contextMenu.nodeId)} />}
    </div>
  );
};
export default Editor;