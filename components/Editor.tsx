import React, { useState, useEffect, useCallback, useRef } from 'react';
import { produce } from 'immer';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
// FIX: Import duplicateNodeById.
import type { WebsiteData, WebsiteNode, Section, Session, ElementType, Device, ResponsiveStyles, Element, Page } from '../types';
import { findNodeById, updateNodeById, removeNodeById, addNode, moveNode, duplicateNodeById, findNodePath } from '../utils/tree';
import { generateSectionContent } from '../services/geminiService';
import GlobalSettingsForm from './GlobalSettingsForm';
import StylePanel from './SectionEditorForm';
import Preview from './Preview';
import PublishModal from './PublishModal';
// FIX: Import DuplicateIcon.
import { DesktopIcon, TabletIcon, MobileIcon, LayersIcon, PlusIcon as ComponentIcon, SettingsIcon, PencilIcon, TrashIcon, VideoIcon, StarIcon, CheckIcon, HeartIcon, UndoIcon, RedoIcon, CopyIcon, PasteIcon, FormIcon, EmbedIcon, MagicWandIcon, HomeIcon, PageSettingsIcon, DuplicateIcon, ColumnIcon, LockIcon, UnlockIcon, LayoutIcon, SunIcon, MoonIcon, CommandIcon, AssetIcon, WireframeIcon, HistoryIcon } from './icons';
import ContextMenu from './ContextMenu';
import SectionTemplatesPanel from './SectionTemplatesPanel';
import PageSettingsModal from './PageSettingsModal';
import AssetManager from './AssetManager';

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
  lastSaved: Date | null;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenCommandPalette: () => void;
}> = ({ websiteName, device, editingContext, onSetDevice, onSetEditingContext, onPublish, isSaving, lastSaved, onUndo, onRedo, canUndo, canRedo, onOpenCommandPalette }) => {
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
        <div className="text-xs text-slate-500 h-4 min-w-[100px] text-right"> {isSaving ? 'Saving...' : lastSaved ? `Saved` : ''} </div>
        <button onClick={onPublish} className="bg-indigo-600 text-white font-bold py-1.5 px-4 rounded-md text-sm hover:bg-indigo-700"> Publish </button>
      </div>
    </div>
  );
};

// ... LayersPanel, AddPanel etc ...
const LayerItem: React.FC<{
    node: WebsiteNode;
    selectedNodeIds: string[];
    onSelectNode: (id: string, e: React.MouseEvent) => void;
    onRenameNode: (id: string, newName: string) => void;
    [key: string]: any; // for other props
}> = ({ node, selectedNodeIds, onSelectNode, onRenameNode, ...rest }) => {
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

    // FIX: Stop propagation on double click to prevent it from also triggering selection.
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
            </div>
            {'children' in node && Array.isArray(node.children) && node.children.length > 0 && (
                <div className="layer-children">
                    {node.children.map(child => (
                        <LayerItem key={child.id} node={child as WebsiteNode} selectedNodeIds={selectedNodeIds} onSelectNode={onSelectNode} onRenameNode={onRenameNode} {...rest} />
                    ))}
                </div>
            )}
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
  
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
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
  
  const handleCloseContextMenu = useCallback(() => {
      setContextMenu(null);
  }, []);

  useEffect(() => {
      window.addEventListener('click', handleCloseContextMenu);
      window.addEventListener('contextmenu', handleCloseContextMenu); // Close on another right-click
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

        if (selectedNodeIds.length === 0) return;
        const selectedNodeId = selectedNodeIds[0];

        // Delete node
        if (e.key === 'Delete' || e.key === 'Backspace') {
            const activeEl = document.activeElement;
            if (activeEl?.hasAttribute('contenteditable') && activeEl?.getAttribute('contenteditable') === 'true') {
                return; // Don't delete node if user is typing
            }
            e.preventDefault();
            handleDeleteNode(selectedNodeId);
        }

        // Duplicate node
        if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
            e.preventDefault();
            handleDuplicateNode(selectedNodeId);
        }
        
        // Copy Node
        if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
            e.preventDefault();
            handleCopyNode(selectedNodeId);
        }
        
        // Paste Node
        if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
            e.preventDefault();
            handlePasteNode(selectedNodeId);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds]);
  
  
  const handleContextMenuRequest = (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };
  
  const activePage = websiteData?.pages.find(p => p.id === activePageId);
  const contentTree = editingContext === 'page' ? activePage?.children : websiteData?.[editingContext];
  const selectedNode = contentTree && selectedNodeIds.length === 1 ? findNodeById(contentTree, selectedNodeIds[0]) : null;


  const saveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (websiteData) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setIsSaving(true);
      saveTimer.current = window.setTimeout(async () => {
        try {
          await fetch('/api/editor-data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ websiteId, websiteData }) });
          setLastSaved(new Date());
        } catch (e) {
          console.error("Failed to save:", e);
        } finally {
          setIsSaving(false);
        }
      }, 1500);
    }
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [websiteData, websiteId]);
  
  const handleUpdateNode = useCallback((id: string, updates: Partial<WebsiteNode>) => {
    setWebsiteData(draft => {
        if (!draft) return;
        const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext];
        if (tree) updateNodeById(tree, id, updates);
    }, `Update ${findNodeById(contentTree || [], id)?.type}`);
  }, [setWebsiteData, activePageId, editingContext, contentTree]);


  const handleDeleteNode = useCallback((id: string) => {
    setWebsiteData(draft => {
        if (!draft) return;
        const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext];
        if (tree && removeNodeById(tree, id)) {
            setSelectedNodeIds([]);
            setActiveTab('pages');
        }
    }, `Delete node`);
  }, [setWebsiteData, activePageId, editingContext]);

  const handleAddElement = useCallback((type: ElementType) => {
    if (selectedNodeIds.length !== 1) { alert("Please select a single column to add the element to."); return; }
    
    setWebsiteData(draft => {
        if (!draft) return;
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
            if (editingContext !== 'page') {
                draft[editingContext] = container.children as Section[];
            }
        } else {
            alert("Elements can only be added inside columns.");
        }
    }, `Add ${type} element`);
  }, [selectedNodeIds, setWebsiteData, activePageId, editingContext]);
  
  const handleAddNode = useCallback((type: 'column' | 'section', parentId?: string) => {
      setWebsiteData(draft => {
          if (!draft) return;
          let container: { children: WebsiteNode[] } & { id?: string };
          if (editingContext === 'page') {
            const page = draft.pages.find(p => p.id === activePageId);
            if (!page) return;
            container = page;
          } else {
            container = { children: draft[editingContext] };
          }
          
          if (type === 'section') {
             addNode(container, container.id || '', 'section');
          } else if (type === 'column' && parentId) {
              addNode(container, parentId, 'column');
          }

          if (editingContext !== 'page') {
            draft[editingContext] = container.children as Section[];
          }
      }, `Add ${type}`);
  }, [activePageId, setWebsiteData, editingContext]);
  
  const handleAddSection = useCallback((context: 'page' | 'header' | 'footer') => {
      setWebsiteData(draft => {
          if (!draft) return;
          const target = context === 'page' ? draft.pages.find(p => p.id === activePageId) : draft;
          if (!target) return;
          const newSection: Section = { id: uuidv4(), type: 'section', styles: { desktop: { paddingTop: '2rem', paddingBottom: '2rem'}, tablet: {}, mobile: {} }, children: [ { id: uuidv4(), type: 'row', styles: { desktop: {}, tablet: {}, mobile: {} }, children: [{ id: uuidv4(), type: 'column', styles: { desktop: {flexBasis: '100%'}, tablet: {}, mobile: {} }, children: [] }] } ] };
          target[context === 'page' ? 'children' : context].push(newSection);
          setSelectedNodeIds([newSection.id]);
          setActiveTab('style');
      }, `Add Section`);
  }, [activePageId, setWebsiteData]);

  const handleSelectNode = useCallback((id: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
        setSelectedNodeIds(prev => prev.includes(id) ? prev.filter(nid => nid !== id) : [...prev, id]);
    } else {
        setSelectedNodeIds([id]);
    }
    setActiveTab('style');
  }, []);
  
  const handleMoveNode = useCallback((sourceId: string, targetId: string, position: 'top' | 'bottom') => {
      setWebsiteData(draft => {
          if (!draft) return;
          const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext];
          if (tree) moveNode(tree, sourceId, targetId, position === 'top' ? 'before' : 'after');
      }, `Move Node`);
  }, [editingContext, activePageId, setWebsiteData]);
  
  const handleCopyStyles = (nodeId: string) => {
      if (!contentTree) return;
      const node = findNodeById(contentTree, nodeId);
      if (node) {
          setCopiedStyles(node.styles);
      }
  };
  
  const handlePasteStyles = (nodeId: string) => {
      if (copiedStyles) {
          handleUpdateNode(nodeId, { styles: copiedStyles });
      }
  };
  
  const handleCopyNode = (nodeId: string) => {
      if (!contentTree) return;
      const node = findNodeById(contentTree, nodeId);
      if (node) {
          setCopiedNode(node);
      }
  };

  const handlePasteNode = (targetNodeId: string) => {
      if (!copiedNode) return;
      setWebsiteData(draft => {
          if (!draft) return;
          const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext];
          if (tree) {
             // This is a simplified paste - it just duplicates the node under the same parent
             duplicateNodeById(tree, targetNodeId); // Re-using duplicate logic is simplest here
          }
      }, `Paste Node`);
  };
  
  const handleDuplicateNode = useCallback((nodeId: string) => {
        setWebsiteData(draft => {
          if (!draft) return;
          const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext];
          if (tree) duplicateNodeById(tree, nodeId);
        }, `Duplicate node`);
  }, [editingContext, activePageId, setWebsiteData]);
  
  const handleToggleLock = (nodeId: string) => {
      if (!contentTree) return;
      const node = findNodeById(contentTree, nodeId);
      if (node) {
          handleUpdateNode(nodeId, { locked: !node.locked });
      }
  }

  const handleGenerateSectionContent = async (sectionId: string) => {
      if (!websiteData || !activePage) return;
      const sectionNode = findNodeById(contentTree || [], sectionId) as Section;
      if (!sectionNode || sectionNode.type !== 'section') {
          alert("Content can only be generated for a 'section'.");
          return;
      }
      setGeneratingSectionId(sectionId);
      try {
          const generatedColumns = await generateSectionContent(websiteData, activePage.tagline, sectionNode);
          handleUpdateNode(sectionId, { 
              children: sectionNode.children.map((row, rowIndex) => ({
                  ...row,
                  children: row.children.map((col, colIndex) => ({
                      ...col,
                      children: generatedColumns[colIndex]?.map(el => ({
                          id: uuidv4(),
                          type: el.type,
                          content: el.content,
                          styles: { desktop: {}, tablet: {}, mobile: {} }
                      })) || []
                  }))
              }))
          });
      } catch (e) {
          console.error(e);
          alert("Failed to generate AI content.");
      } finally {
          setGeneratingSectionId(null);
      }
  };

  const handleUpdatePage = (pageId: string, updates: Partial<Page>) => {
      setWebsiteData(draft => {
          if (!draft) return;
          const pageIndex = draft.pages.findIndex(p => p.id === pageId);
          if (pageIndex !== -1) {
              const oldPage = draft.pages[pageIndex];
              draft.pages[pageIndex] = { ...oldPage, ...updates };

              // If setting a page as homepage, unset all others
              if (updates.isHomepage) {
                  draft.pages.forEach((p, i) => {
                      if (i !== pageIndex) p.isHomepage = false;
                  });
              }
          }
      }, `Update page ${updates.name || ''}`);
  };

  const handleDuplicatePage = (pageId: string) => {
      setWebsiteData(draft => {
          if (!draft) return;
          const pageToDuplicate = draft.pages.find(p => p.id === pageId);
          if (pageToDuplicate) {
              const newPage = { ...pageToDuplicate, id: uuidv4(), name: `${pageToDuplicate.name} Copy`, slug: `${pageToDuplicate.slug}-copy`, isHomepage: false };
              draft.pages.push(newPage);
          }
      }, `Duplicate page`)
  };

  const handleRenameNode = (nodeId: string, newName: string) => {
      handleUpdateNode(nodeId, { customName: newName });
  };
  
  const handleAiTextUpdate = async (nodeId: string, action: string, options?: { tone?: string }) => {
      if (!activePage) return;
      const node = findNodeById(contentTree || [], nodeId) as Element;
      if (!node || !('content' in node) || !('text' in node.content)) return;

      const textContent = (node.content as any).text.replace(/<[^>]*>?/gm, '');

      setIsAiLoading(true);
      try {
          const res = await fetch('/api/ai-text', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: textContent, action, ...options })
          });
          const data = await res.json();
          if (res.ok) {
              handleUpdateNode(nodeId, { content: { ...node.content, text: data.newText }});
          } else {
              throw new Error(data.message || 'AI request failed');
          }
      } catch (e) {
          alert(e instanceof Error ? e.message : 'An error occurred.');
      } finally {
          setIsAiLoading(false);
      }
  }


  if (!websiteData || !activePage) { return <div className="editor-container items-center justify-center"><div className="dashboard-spinner"></div></div>; }
  if (error) { return <div className="p-4 text-red-600">{error}</div>; }

  const nodePath = contentTree && selectedNode ? findNodePath(contentTree, selectedNode.id) : [];

  return (
    <div className={`editor-container ${editorTheme === 'dark' ? 'dark-mode' : ''}`}>
      <EditorTopBar websiteName={websiteData.name} device={device} editingContext={editingContext} onSetDevice={setDevice} onSetEditingContext={setEditingContext} onPublish={() => setIsPublishModalOpen(true)} isSaving={isSaving} lastSaved={lastSaved} onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo} onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />
      <div className="editor-main">
        <aside className="editor-sidebar">
          <div className="sidebar-tabs">
             {[{id: 'pages', icon: LayersIcon, label: 'Layers'}, {id: 'add', icon: ComponentIcon, label: 'Add'}, {id: 'history', icon: HistoryIcon, label: 'History'}, {id: 'style', icon: SettingsIcon, label: 'Style'}, {id: 'settings', icon: SettingsIcon, label: 'Global'}].map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`} disabled={tab.id === 'style' && selectedNodeIds.length === 0}>
                    <tab.icon className="w-5 h-5" /> {tab.label}
                 </button>
             ))}
          </div>
          <div className="sidebar-content">
             {activeTab === 'pages' && (
                <div className="p-2">
                    <div className="flex items-center justify-between p-2">
                        <h3 className="font-semibold">Pages</h3>
                    </div>
                     <div className="space-y-1">
                     {websiteData.pages.map(page => (
                        <div key={page.id} className={`p-2 rounded-md cursor-pointer flex items-center justify-between ${page.id === activePageId ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-slate-100'}`} onClick={() => setActivePageId(page.id)}>
                            <div className="flex items-center gap-2">
                               {page.isHomepage && <HomeIcon className="w-4 h-4" />}
                               <span>{page.name}</span>
                            </div>
                            <div>
                                <button onClick={(e) => { e.stopPropagation(); handleDuplicatePage(page.id); }} className="text-slate-500 hover:text-indigo-600 p-1"><DuplicateIcon className="w-4 h-4"/></button>
                                <button onClick={(e) => { e.stopPropagation(); setEditingPage(page); }} className="text-slate-500 hover:text-indigo-600 p-1"><PageSettingsIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                     ))}
                     </div>
                     <hr className="my-2" />
                     {contentTree?.map(child => <LayerItem key={child.id} node={child} selectedNodeIds={selectedNodeIds} onSelectNode={handleSelectNode} onRenameNode={handleRenameNode} />)}
                </div>
             )}
             {activeTab === 'add' && <AddPanel onAddElement={handleAddElement} />}
             {activeTab === 'history' && (
                <div>
                    {history.slice().reverse().map((item, index) => {
                        const realIndex = history.length - 1 - index;
                        return (
                            <div key={realIndex} onClick={() => jumpToState(realIndex)} className={`history-item ${realIndex === currentIndex ? 'active' : ''}`}>
                                {item.message}
                            </div>
                        )
                    })}
                </div>
             )}
             {activeTab === 'templates' && <SectionTemplatesPanel onAddSection={handleAddSection} />}
             {activeTab === 'style' && selectedNode && ( <StylePanel key={selectedNode.id} node={selectedNode} nodePath={nodePath || []} onSelectNode={(id) => setSelectedNodeIds([id])} websiteData={websiteData} onUpdate={handleUpdateNode} onOpenAssetManager={() => setIsAssetManagerOpen(true)} /> )}
             {activeTab === 'settings' && <GlobalSettingsForm websiteData={websiteData} setWebsiteData={setWebsiteData} onAddSection={handleAddSection} onSetEditingContext={setEditingContext} />}
          </div>
           <div className="p-2 border-t flex items-center justify-between">
                <div>
                     <button onClick={() => setViewMode(viewMode === 'normal' ? 'wireframe' : 'normal')} className="p-2 rounded text-slate-500 hover:bg-slate-100" title="Toggle Wireframe Mode">
                        <WireframeIcon className="w-5 h-5" />
                    </button>
                     <button onClick={() => setIsAssetManagerOpen(true)} className="p-2 rounded text-slate-500 hover:bg-slate-100" title="Asset Manager">
                        <AssetIcon className="w-5 h-5" />
                    </button>
                </div>
                <button onClick={() => setEditorTheme(editorTheme === 'light' ? 'dark' : 'light')} className="p-2 rounded text-slate-500 hover:bg-slate-100" title="Toggle Theme">
                    {editorTheme === 'light' ? <MoonIcon className="w-5 h-5"/> : <SunIcon className="w-5 h-5"/>}
                </button>
           </div>
        </aside>
        <main className={`editor-preview-wrapper ${viewMode === 'wireframe' ? 'wireframe-mode' : ''}`} onClick={() => setSelectedNodeIds([])}>
            <div className={`preview-canvas preview-canvas-${device}`}>
                <Preview websiteData={websiteData} activePage={activePage} interactive device={device} selectedNodeId={selectedNodeIds[0]} hoveredNodeId={hoveredNodeId} onSelectNode={(id, e) => handleSelectNode(id, e)} onHoverNode={setHoveredNodeId} onUpdateNode={handleUpdateNode} onAiTextUpdate={handleAiTextUpdate} isAiLoading={isAiLoading} onContextMenuRequest={handleContextMenuRequest} onAddSection={handleAddSection}/>
            </div>
        </main>
      </div>
      {isPublishModalOpen && session.username && <PublishModal username={session.username} websiteData={websiteData} onClose={() => setIsPublishModalOpen(false)} onPublishSuccess={(d) => { /* Can update state if needed */ }} />}
      {editingPage && <PageSettingsModal page={editingPage} onClose={() => setEditingPage(null)} onSave={(updates) => handleUpdatePage(editingPage.id, updates)} />}
       {isAssetManagerOpen && <AssetManager websiteData={websiteData} onClose={() => setIsAssetManagerOpen(false)} onUpdateAssets={(newAssets) => setWebsiteData(draft => { if (draft) draft.assets = newAssets; }, 'Update Assets')} />}
      {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            nodeId={contextMenu.nodeId}
            onClose={handleCloseContextMenu}
            onDuplicate={() => handleDuplicateNode(contextMenu.nodeId)}
            onDelete={() => handleDeleteNode(contextMenu.nodeId)}
            onCopyStyles={() => handleCopyStyles(contextMenu.nodeId)}
            onPasteStyles={() => handlePasteStyles(contextMenu.nodeId)}
            onCopyNode={() => handleCopyNode(contextMenu.nodeId)}
            onPasteNode={() => handlePasteNode(contextMenu.nodeId)}
            canPasteStyles={!!copiedStyles}
            canPasteNode={!!copiedNode}
          />
      )}
    </div>
  );
};
export default Editor;