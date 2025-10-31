


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { produce } from 'immer';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
// FIX: Import duplicateNodeById.
import type { WebsiteData, WebsiteNode, Section, Session, ElementType, Device, ResponsiveStyles, Element, Page } from '../types';
import { findNodeById, updateNodeById, removeNodeById, addNode, moveNode, duplicateNodeById } from '../utils/tree';
import { generateSectionContent } from '../services/geminiService';
import GlobalSettingsForm from './GlobalSettingsForm';
import StylePanel from './SectionEditorForm';
import Preview from './Preview';
import PublishModal from './PublishModal';
// FIX: Import DuplicateIcon.
import { DesktopIcon, TabletIcon, MobileIcon, LayersIcon, PlusIcon as ComponentIcon, SettingsIcon, PencilIcon, TrashIcon, VideoIcon, StarIcon, CheckIcon, HeartIcon, UndoIcon, RedoIcon, CopyIcon, PasteIcon, FormIcon, EmbedIcon, MagicWandIcon, HomeIcon, PageSettingsIcon, DuplicateIcon, ColumnIcon, LockIcon, UnlockIcon, LayoutIcon } from './icons';
import ContextMenu from './ContextMenu';
import SectionTemplatesPanel from './SectionTemplatesPanel';

type DropPosition = 'top' | 'bottom';
type EditingContext = 'page' | 'header' | 'footer';

// Custom hook for state management with undo/redo
const useHistoryState = <T,>(initialState: T) => {
    const [history, setHistory] = useState<T[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const setState = (action: (draft: T) => void | T, fromHistory = false) => {
        if (!history[currentIndex]) return;
        const newState = produce(history[currentIndex], action as any);
        if (fromHistory) {
            setHistory(currentHistory => [...currentHistory, newState]);
            setCurrentIndex(history.length);
        } else {
            const newHistory = history.slice(0, currentIndex + 1);
            newHistory.push(newState);
            setHistory(newHistory);
            setCurrentIndex(newHistory.length - 1);
        }
    };
    
    const setInitialState = (state: T) => {
        setHistory([state]);
        setCurrentIndex(0);
    }

    const undo = () => { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); };
    const redo = () => { if (currentIndex < history.length - 1) setCurrentIndex(prev => prev - 1); };

    return {
        state: history[currentIndex],
        setState,
        setInitialState,
        undo,
        redo,
        canUndo: currentIndex > 0,
        canRedo: currentIndex < history.length - 1,
    };
};


//================================================================================================
// SUB-COMPONENTS
//================================================================================================
const PageSettingsModal: React.FC<{
    page: Page;
    onClose: () => void;
    onSave: (pageId: string, updates: Partial<Page>) => void;
}> = ({ page, onClose, onSave }) => {
    const [name, setName] = useState(page.name);
    const [slug, setSlug] = useState(page.slug);
    const [tagline, setTagline] = useState(page.tagline);
    const [heroImageUrl, setHeroImageUrl] = useState(page.heroImageUrl);

    const handleSave = () => {
        onSave(page.id, { name, slug, tagline, heroImageUrl });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">Page Settings</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-600 block mb-1">Page Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded"/>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600 block mb-1">URL Slug</label>
                        <input type="text" value={slug} onChange={e => setSlug(e.target.value)} className="w-full p-2 border rounded"/>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-600 block mb-1">Tagline</label>
                        <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} className="w-full p-2 border rounded"/>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-slate-600 block mb-1">Hero Image URL</label>
                        <input type="text" value={heroImageUrl} onChange={e => setHeroImageUrl(e.target.value)} className="w-full p-2 border rounded"/>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded text-slate-600 bg-white border">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded text-white bg-indigo-600">Save Changes</button>
                </div>
            </div>
        </div>
    );
};


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
}> = ({ websiteName, device, editingContext, onSetDevice, onSetEditingContext, onPublish, isSaving, lastSaved, onUndo, onRedo, canUndo, canRedo }) => {
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
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs text-slate-500 h-4 min-w-[100px] text-right"> {isSaving ? 'Saving...' : lastSaved ? `Saved` : ''} </div>
        <button onClick={onPublish} className="bg-indigo-600 text-white font-bold py-1.5 px-4 rounded-md text-sm hover:bg-indigo-700"> Publish </button>
      </div>
    </div>
  );
};

// ... LayersPanel, AddPanel etc ...
// FIX: Changed copiedNodeId prop to copiedStyles to correctly reflect the data being passed.
const LayerItem: React.FC<any> = ({ node, selectedNodeId, copiedStyles, generatingSectionId, onSelectNode, onDeleteNode, onDuplicateNode, onMoveNode, onCopyStyles, onPasteStyles, onGenerateSectionContent, onToggleLock, onAddNode }) => {
    const isSelected = selectedNodeId === node.id;
    const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);
    const handleDragStart = (e: React.DragEvent) => { e.dataTransfer.setData('text/plain', node.id); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); const rect = e.currentTarget.getBoundingClientRect(); const middleY = rect.top + rect.height / 2; setDropPosition(e.clientY < middleY ? 'top' : 'bottom'); };
    const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const sourceId = e.dataTransfer.getData('text/plain'); if (sourceId && sourceId !== node.id && dropPosition) { onMoveNode(sourceId, node.id, dropPosition); } setDropPosition(null); };
    const getIndicatorClass = () => dropPosition ? (dropPosition === 'top' ? 'drop-indicator-top' : 'drop-indicator-bottom') : '';
    const isGenerating = generatingSectionId === node.id;
    return (
        <div className="layer-item-wrapper">
            <div draggable={!node.locked} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragLeave={() => setDropPosition(null)} onDrop={handleDrop} className={`layer-item ${isSelected ? 'selected' : ''} ${getIndicatorClass()}`} onClick={(e) => { e.stopPropagation(); onSelectNode(node.id); }}>
                <div className="layer-item-content"> <span className="layer-item-icon">&#x25A1;</span> <span>{node.type}</span> {isGenerating && <div className="dashboard-spinner !w-4 !h-4 !border-2 ml-2"></div>} </div>
                 <div className="flex items-center ml-auto opacity-50 hover:opacity-100 transition-opacity"> 
                    {node.type === 'section' && <button onClick={(e) => { e.stopPropagation(); onGenerateSectionContent(node.id); }} title="Generate Content with AI" className="text-slate-500 hover:text-indigo-600 px-1 disabled:text-slate-300" disabled={isGenerating}><MagicWandIcon className="w-4 h-4" /></button>} 
                    {node.type === 'row' && <button onClick={(e) => { e.stopPropagation(); onAddNode('column', node.id); }} title="Add Column" className="text-slate-500 hover:text-indigo-600 px-1"><ColumnIcon className="w-4 h-4" /></button>}
                    <button onClick={(e) => { e.stopPropagation(); onCopyStyles(node.id); }} title="Copy Styles" className="text-slate-500 hover:text-indigo-600 px-1"><CopyIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onPasteStyles(node.id); }} title="Paste Styles" disabled={!copiedStyles} className="text-slate-500 hover:text-indigo-600 px-1 disabled:text-slate-300"><PasteIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDuplicateNode(node.id); }} title="Duplicate" className="text-slate-500 hover:text-indigo-600 px-1"><DuplicateIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onToggleLock(node.id); }} title={node.locked ? "Unlock" : "Lock"} className="text-slate-500 hover:text-indigo-600 px-1">{node.locked ? <UnlockIcon className="w-4 h-4" /> : <LockIcon className="w-4 h-4" />}</button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }} title="Delete" className="text-slate-500 hover:text-red-600 px-1"><TrashIcon className="w-4 h-4" /></button>
                 </div>
            </div>
            {'children' in node && Array.isArray(node.children) && node.children.length > 0 && ( <div className="layer-children"> {node.children.map(child => <LayerItem key={child.id} node={child as WebsiteNode} {...{selectedNodeId, copiedStyles, generatingSectionId, onSelectNode, onDeleteNode, onDuplicateNode, onMoveNode, onCopyStyles, onPasteStyles, onGenerateSectionContent, onToggleLock, onAddNode}} />)} </div> )}
        </div>
    )
}
const AddPanel: React.FC<{ onAddElement: (type: ElementType) => void }> = ({ onAddElement }) => {
  const elements: { type: ElementType, label: string, icon: React.FC<any> }[] = [ { type: 'headline', label: 'Headline', icon: PencilIcon }, { type: 'text', label: 'Text', icon: PencilIcon }, { type: 'button', label: 'Button', icon: PencilIcon }, { type: 'image', label: 'Image', icon: PencilIcon }, { type: 'spacer', label: 'Spacer', icon: CheckIcon }, { type: 'video', label: 'Video', icon: VideoIcon }, { type: 'icon', label: 'Icon', icon: StarIcon }, { type: 'form', label: 'Form', icon: FormIcon }, { type: 'embed', label: 'Embed', icon: EmbedIcon }, { type: 'navigation', label: 'Navigation', icon: MagicWandIcon }, { type: 'gallery', label: 'Gallery', icon: MagicWandIcon }, { type: 'divider', label: 'Divider', icon: MagicWandIcon }, { type: 'map', label: 'Map', icon: MagicWandIcon }, ];
  return ( <div className="add-element-grid"> {elements.map(el => ( <button key={el.type} onClick={() => onAddElement(el.type)} className="add-element-button"> <el.icon className="w-6 h-6" /> <span>{el.label}</span> </button> ))} </div> );
};

//================================================================================================
// EDITOR MAIN COMPONENT
//================================================================================================
const Editor: React.FC<{session: Session}> = ({ session }) => {
  const { websiteId } = useParams<{ websiteId: string }>();
  const { state: websiteData, setState: setWebsiteData, setInitialState: setInitialWebsiteData, undo, redo, canUndo, canRedo } = useHistoryState<WebsiteData | null>(null);
  
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pages' | 'add' | 'templates' | 'style' | 'settings'>('pages');
  const [device, setDevice] = useState<Device>('desktop');
  const [editingContext, setEditingContext] = useState<EditingContext>('page');
  const [copiedStyles, setCopiedStyles] = useState<ResponsiveStyles | null>(null);
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

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
  }, [websiteId]);
  
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
        if (!selectedNodeId) return;

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId]);
  
  
  const handleContextMenuRequest = (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };
  
  const activePage = websiteData?.pages.find(p => p.id === activePageId);
  const contentTree = editingContext === 'page' ? activePage?.children : websiteData?.[editingContext];
  const selectedNode = contentTree && selectedNodeId ? findNodeById(contentTree, selectedNodeId) : null;


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
    });
  }, [setWebsiteData, activePageId, editingContext]);


  const handleDeleteNode = useCallback((id: string) => {
    setWebsiteData(draft => {
        if (!draft) return;
        const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext];
        if (tree && removeNodeById(tree, id)) {
            setSelectedNodeId(null);
            setActiveTab('pages');
        }
    });
  }, [setWebsiteData, activePageId, editingContext]);

  const handleAddElement = useCallback((type: ElementType) => {
    if (!selectedNodeId) { alert("Please select a column to add the element to."); return; }
    
    setWebsiteData(draft => {
        if (!draft) return;

        // FIX: The object passed to tree utility functions must conform to `{ children: WebsiteNode[] }`.
        // For 'header' and 'footer', we create a temporary wrapper that Immer can work with.
        let container: { children: WebsiteNode[] };
        if (editingContext === 'page') {
            const page = draft.pages.find(p => p.id === activePageId);
            if (!page) return;
            container = page;
        } else {
            container = { children: draft[editingContext] };
        }

        const parentNode = findNodeById(container.children, selectedNodeId);
        const targetParentId = (parentNode && parentNode.type === 'column') ? parentNode.id : null;
        
        if (targetParentId) {
            addNode(container, targetParentId, type);
            // If we used a temporary wrapper, we must assign the mutated children array back to the draft.
            if (editingContext !== 'page') {
                draft[editingContext] = container.children as Section[];
            }
        } else {
            alert("Elements can only be added inside columns.");
        }
    });
  }, [selectedNodeId, setWebsiteData, activePageId, editingContext]);
  
  const handleAddNode = useCallback((type: 'column' | 'section', parentId?: string) => {
      setWebsiteData(draft => {
          if (!draft) return;
          // FIX: The object passed to tree utility functions must conform to `{ children: WebsiteNode[] }`.
          // For 'header' and 'footer', we create a temporary wrapper that Immer can work with.
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

          // If we used a temporary wrapper, we must assign the mutated children array back to the draft.
          if (editingContext !== 'page') {
            draft[editingContext] = container.children as Section[];
          }
      });
  }, [activePageId, setWebsiteData, editingContext]);
  
  const handleAddSection = useCallback((context: 'page' | 'header' | 'footer') => {
      setWebsiteData(draft => {
          if (!draft) return;
          const target = context === 'page' ? draft.pages.find(p => p.id === activePageId) : draft;
          if (!target) return;
          const newSection: Section = { id: uuidv4(), type: 'section', styles: { desktop: { paddingTop: '2rem', paddingBottom: '2rem'}, tablet: {}, mobile: {} }, children: [ { id: uuidv4(), type: 'row', styles: { desktop: {}, tablet: {}, mobile: {} }, children: [{ id: uuidv4(), type: 'column', styles: { desktop: {flexBasis: '100%'}, tablet: {}, mobile: {} }, children: [] }] } ] };
          target[context === 'page' ? 'children' : context].push(newSection);
          setSelectedNodeId(newSection.id);
          setActiveTab('style');
      });
  }, [activePageId, setWebsiteData]);

  const handleSelectNode = useCallback((id: string) => {
    setSelectedNodeId(id);
    setActiveTab('style');
  }, []);
  
  const handleMoveNode = useCallback((sourceId: string, targetId: string, position: 'top' | 'bottom') => {
      setWebsiteData(draft => {
          if (!draft) return;
          const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext];
          if (tree) moveNode(tree, sourceId, targetId, position === 'top' ? 'before' : 'after');
      });
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
  
  const handleDuplicateNode = useCallback((nodeId: string) => {
        setWebsiteData(draft => {
          if (!draft) return;
          const tree = editingContext === 'page' ? draft.pages.find(p => p.id === activePageId)?.children : draft[editingContext];
          if (tree) duplicateNodeById(tree, nodeId);
        });
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
              draft.pages[pageIndex] = { ...draft.pages[pageIndex], ...updates };
          }
      });
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

  return (
    <div className="editor-container">
      <EditorTopBar websiteName={websiteData.name} device={device} editingContext={editingContext} onSetDevice={setDevice} onSetEditingContext={setEditingContext} onPublish={() => setIsPublishModalOpen(true)} isSaving={isSaving} lastSaved={lastSaved} onUndo={undo} onRedo={redo} canUndo={canUndo} canRedo={canRedo} />
      <div className="editor-main">
        <aside className="editor-sidebar">
          <div className="sidebar-tabs">
             {[{id: 'pages', icon: LayersIcon, label: 'Layers'}, {id: 'add', icon: ComponentIcon, label: 'Add'}, {id: 'templates', icon: LayoutIcon, label: 'Templates'}, {id: 'style', icon: SettingsIcon, label: 'Style'}, {id: 'settings', icon: SettingsIcon, label: 'Global'}].map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`} disabled={tab.id === 'style' && !selectedNodeId}>
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
                            <button onClick={(e) => { e.stopPropagation(); setEditingPage(page); }} className="text-slate-500 hover:text-indigo-600"><PageSettingsIcon className="w-4 h-4"/></button>
                        </div>
                     ))}
                     </div>
                     <hr className="my-2" />
                     {contentTree?.map(child => <LayerItem key={child.id} node={child} selectedNodeId={selectedNodeId} copiedStyles={copiedStyles} generatingSectionId={generatingSectionId} onSelectNode={handleSelectNode} onDeleteNode={handleDeleteNode} onDuplicateNode={handleDuplicateNode} onMoveNode={handleMoveNode} onCopyStyles={handleCopyStyles} onPasteStyles={handlePasteStyles} onGenerateSectionContent={handleGenerateSectionContent} onToggleLock={handleToggleLock} onAddNode={handleAddNode}/>)}
                </div>
             )}
             {activeTab === 'add' && <AddPanel onAddElement={handleAddElement} />}
             {activeTab === 'templates' && <SectionTemplatesPanel onAddSection={handleAddSection} />}
             {activeTab === 'style' && selectedNode && ( <StylePanel key={selectedNode.id} node={selectedNode} websiteData={websiteData} onUpdate={handleUpdateNode} /> )}
             {activeTab === 'settings' && <GlobalSettingsForm websiteData={websiteData} setWebsiteData={setWebsiteData} onAddSection={handleAddSection} onSetEditingContext={setEditingContext} />}
          </div>
        </aside>
        <main className="editor-preview-wrapper" onClick={() => setSelectedNodeId(null)}>
            <div className={`preview-canvas preview-canvas-${device}`}>
                <Preview websiteData={websiteData} activePage={activePage} interactive device={device} selectedNodeId={selectedNodeId} hoveredNodeId={hoveredNodeId} onSelectNode={handleSelectNode} onHoverNode={setHoveredNodeId} onUpdateNode={handleUpdateNode} onAiTextUpdate={handleAiTextUpdate} isAiLoading={isAiLoading} onContextMenuRequest={handleContextMenuRequest} onAddSection={handleAddSection}/>
            </div>
        </main>
      </div>
      {isPublishModalOpen && session.username && <PublishModal username={session.username} websiteData={websiteData} onClose={() => setIsPublishModalOpen(false)} onPublishSuccess={(d) => { /* Can update state if needed */ }} />}
      {editingPage && <PageSettingsModal page={editingPage} onClose={() => setEditingPage(null)} onSave={handleUpdatePage} />}
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
            canPasteStyles={!!copiedStyles}
          />
      )}
    </div>
  );
};
export default Editor;