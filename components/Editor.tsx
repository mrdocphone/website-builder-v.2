
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { produce } from 'immer';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { WebsiteData, WebsiteNode, Section, Session, ElementType, Device, ResponsiveStyles, Element } from '../types';
import { findNodeById, updateNodeById, removeNodeById, addNode, moveNode } from '../utils/tree';
import { generateSectionContent } from '../services/geminiService';
import GlobalSettingsForm from './GlobalSettingsForm';
import StylePanel from './SectionEditorForm';
import Preview from './Preview';
import PublishModal from './PublishModal';
import { DesktopIcon, TabletIcon, MobileIcon, LayersIcon, PlusIcon as ComponentIcon, SettingsIcon, PencilIcon, TrashIcon, VideoIcon, StarIcon, CheckIcon, HeartIcon, UndoIcon, RedoIcon, CopyIcon, PasteIcon, FormIcon, EmbedIcon, MagicWandIcon } from './icons';

type DropPosition = 'top' | 'bottom';

// Custom hook for state management with undo/redo
const useHistoryState = <T,>(initialState: T) => {
    const [history, setHistory] = useState<T[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const setState = (action: (draft: T) => void | T, fromHistory = false) => {
        const newState = produce(history[currentIndex], action as any);
        if (fromHistory) {
            setHistory(currentHistory => [...currentHistory, newState]);
            // FIX: Corrected `currentHistory` which was out of scope to `history`. The new index is the length of the old history array.
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
// SUB-COMPONENTS (Defined inside Editor.tsx to avoid creating new files)
//================================================================================================

//
// 1. Editor Top Bar
//
interface EditorTopBarProps {
  websiteName: string;
  device: Device;
  onSetDevice: (device: Device) => void;
  onPublish: () => void;
  isSaving: boolean;
  lastSaved: Date | null;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
const EditorTopBar: React.FC<EditorTopBarProps> = ({ websiteName, device, onSetDevice, onPublish, isSaving, lastSaved, onUndo, onRedo, canUndo, canRedo }) => {
  const navigate = useNavigate();
  const deviceOptions: { id: Device; icon: React.FC<any> }[] = [
    { id: 'desktop', icon: DesktopIcon },
    { id: 'tablet', icon: TabletIcon },
    { id: 'mobile', icon: MobileIcon },
  ];
  return (
    <div className="editor-top-bar">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')} className="text-slate-600 hover:text-indigo-600">
           &larr; Back
        </button>
        <h1 className="text-lg font-semibold text-slate-800">{websiteName}</h1>
      </div>
       <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
            <button onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"><UndoIcon className="w-5 h-5"/></button>
            <button onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded text-slate-500 hover:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"><RedoIcon className="w-5 h-5"/></button>
        </div>
        <div className="flex items-center gap-2 p-1 bg-slate-200 rounded-md">
            {deviceOptions.map(({ id, icon: Icon }) => (
            <button
                key={id}
                onClick={() => onSetDevice(id)}
                className={`p-1.5 rounded ${device === id ? 'bg-white shadow' : 'text-slate-500 hover:bg-slate-100'}`}
                title={`Preview on ${id}`}
            >
                <Icon className="w-5 h-5" />
            </button>
            ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs text-slate-500 h-4 min-w-[100px] text-right">
            {isSaving ? 'Saving...' : lastSaved ? `Saved` : ''}
        </div>
        <button onClick={onPublish} className="bg-indigo-600 text-white font-bold py-1.5 px-4 rounded-md text-sm hover:bg-indigo-700">
          Publish
        </button>
      </div>
    </div>
  );
};


//
// 2. Layers Panel
//
interface LayersPanelProps {
    nodes: WebsiteNode[];
    selectedNodeId: string | null;
    copiedNodeId: string | null;
    generatingSectionId: string | null;
    onSelectNode: (id: string) => void;
    onDeleteNode: (id: string) => void;
    onMoveNode: (sourceId: string, targetId: string, position: DropPosition) => void;
    onCopyStyles: (id: string) => void;
    onPasteStyles: (id: string) => void;
    onGenerateSectionContent: (sectionId: string) => void;
}
const LayerItem: React.FC<{node: WebsiteNode} & Omit<LayersPanelProps, 'nodes'>> = ({ node, selectedNodeId, copiedNodeId, generatingSectionId, onSelectNode, onDeleteNode, onMoveNode, onCopyStyles, onPasteStyles, onGenerateSectionContent }) => {
    const isSelected = selectedNodeId === node.id;
    const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('text/plain', node.id);
        e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const middleY = rect.top + rect.height / 2;
        setDropPosition(e.clientY < middleY ? 'top' : 'bottom');
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData('text/plain');
        if (sourceId && sourceId !== node.id && dropPosition) {
            onMoveNode(sourceId, node.id, dropPosition);
        }
        setDropPosition(null);
    };

    const getIndicatorClass = () => {
        if (!dropPosition) return '';
        return dropPosition === 'top' ? 'drop-indicator-top' : 'drop-indicator-bottom';
    }

    const isGenerating = generatingSectionId === node.id;

    return (
        <div className="layer-item-wrapper">
            <div
                draggable
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={() => setDropPosition(null)}
                onDrop={handleDrop}
                className={`layer-item ${isSelected ? 'selected' : ''} ${getIndicatorClass()}`}
                onClick={(e) => { e.stopPropagation(); onSelectNode(node.id); }}
            >
                <div className="layer-item-content">
                    <span className="layer-item-icon">&#x25A1;</span>
                    <span>{node.type}</span>
                    {isGenerating && <div className="dashboard-spinner !w-4 !h-4 !border-2 ml-2"></div>}
                </div>
                 <div className="flex items-center ml-auto opacity-50 hover:opacity-100 transition-opacity">
                    {node.type === 'section' && <button onClick={(e) => { e.stopPropagation(); onGenerateSectionContent(node.id); }} title="Generate Content with AI" className="text-slate-500 hover:text-indigo-600 px-1 disabled:text-slate-300" disabled={isGenerating}><MagicWandIcon className="w-4 h-4" /></button>}
                    <button onClick={(e) => { e.stopPropagation(); onCopyStyles(node.id); }} title="Copy Styles" className="text-slate-500 hover:text-indigo-600 px-1"><CopyIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onPasteStyles(node.id); }} title="Paste Styles" disabled={!copiedNodeId} className="text-slate-500 hover:text-indigo-600 px-1 disabled:text-slate-300"><PasteIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteNode(node.id); }} title="Delete" className="text-slate-500 hover:text-red-600 px-1"><TrashIcon className="w-4 h-4" /></button>
                 </div>
            </div>
            {'children' in node && Array.isArray(node.children) && node.children.length > 0 && (
                <div className="layer-children">
                    {node.children.map(child => <LayerItem key={child.id} node={child as WebsiteNode} {...{selectedNodeId, copiedNodeId, generatingSectionId, onSelectNode, onDeleteNode, onMoveNode, onCopyStyles, onPasteStyles, onGenerateSectionContent}} />)}
                </div>
            )}
        </div>
    )
}
const LayersPanel: React.FC<LayersPanelProps> = ({ nodes, ...props }) => (
    <div className="p-2">
        {nodes.map(node => <LayerItem key={node.id} node={node} {...props} />)}
    </div>
);

//
// 3. Add Panel
//
const AddPanel: React.FC<{ onAddElement: (type: ElementType) => void }> = ({ onAddElement }) => {
  const elements: { type: ElementType, label: string, icon: React.FC<any> }[] = [
    { type: 'headline', label: 'Headline', icon: PencilIcon },
    { type: 'text', label: 'Text', icon: PencilIcon },
    { type: 'button', label: 'Button', icon: PencilIcon },
    { type: 'image', label: 'Image', icon: PencilIcon },
    { type: 'spacer', label: 'Spacer', icon: CheckIcon },
    { type: 'video', label: 'Video', icon: VideoIcon },
    { type: 'icon', label: 'Icon', icon: StarIcon },
    { type: 'form', label: 'Form', icon: FormIcon },
    { type: 'embed', label: 'Embed', icon: EmbedIcon },
  ];

  return (
    <div className="add-element-grid">
      {elements.map(el => (
        <button key={el.type} onClick={() => onAddElement(el.type)} className="add-element-button">
          <el.icon className="w-6 h-6" />
          <span>{el.label}</span>
        </button>
      ))}
    </div>
  );
};


//================================================================================================
// EDITOR MAIN COMPONENT
//================================================================================================
const Editor: React.FC<{session: Session}> = ({ session }) => {
  const { websiteId } = useParams<{ websiteId: string }>();
  const { state: websiteData, setState: setWebsiteData, setInitialState: setInitialWebsiteData, undo, redo, canUndo, canRedo } = useHistoryState<WebsiteData | null>(null);
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'layers' | 'add' | 'style' | 'settings'>('layers');
  const [device, setDevice] = useState<Device>('desktop');
  const [copiedStyles, setCopiedStyles] = useState<ResponsiveStyles | null>(null);
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!websiteId) { setError("No website ID provided."); return; }
      setError(null);
      try {
        const res = await fetch(`/api/editor-data?websiteId=${websiteId}`);
        if (res.ok) {
          setInitialWebsiteData(await res.json());
        } else {
          setError((await res.json()).message || "Could not load website data.");
        }
      } catch (e) {
        setError("An error occurred while trying to load your website.");
      }
    };
    loadData();
  }, [websiteId]);

  const handleSave = useCallback(async () => {
    if (!websiteData || !session.username || !websiteId) return;
    setIsSaving(true);
    try {
      await fetch('/api/editor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId, websiteData })
      });
      setLastSaved(new Date());
    } catch (error) { console.error('Failed to save data:', error); } 
    finally { setIsSaving(false); }
  }, [websiteData, session.username, websiteId]);

  useEffect(() => {
    const timer = setTimeout(() => { handleSave(); }, 2000);
    return () => clearTimeout(timer);
  }, [websiteData, handleSave]);

  const handleSelectNode = (id: string | null) => {
    setSelectedNodeId(id);
    if (id && findNodeById(websiteData?.children || [], id)) {
        setActiveTab('style'); // Switch to style tab on selection
    }
  };

  const handleUpdateNode = (id: string, updates: Partial<WebsiteNode>) => {
    setWebsiteData(draft => {
      if (draft) { updateNodeById(draft.children, id, updates); }
    });
  };
  
  const handleMoveNode = (sourceId: string, targetId: string, position: DropPosition) => {
      setWebsiteData(draft => {
          if (draft) {
              moveNode(draft.children, sourceId, targetId, position === 'top' ? 'before' : 'after');
          }
      })
  }

  const handleRemoveNode = (id: string) => {
    setWebsiteData(draft => {
      if (draft) { removeNodeById(draft.children, id); }
    });
    if (selectedNodeId === id) setSelectedNodeId(null);
  };
  
  const handleAddNode = (parentId: string, type: 'section' | 'row' | 'column' | ElementType) => {
      setWebsiteData(draft => {
          if(!draft) return;
          addNode(draft, parentId, type);
      })
  }

  const handleAddElementToSelected = (type: ElementType) => {
      if (!selectedNodeId) {
          alert("Please select a section, row, or column in the Layers panel to add an element to.");
          return;
      }
      const parentNode = findNodeById(websiteData?.children || [], selectedNodeId);
      if (parentNode && ['section', 'row', 'column'].includes(parentNode.type)) {
          handleAddNode(selectedNodeId, type);
      } else {
          alert("Elements can only be added to Sections, Rows, or Columns. Please select one.");
      }
  }
  
  const handleCopyStyles = (id: string) => {
      const node = findNodeById(websiteData?.children || [], id);
      if (node) {
          setCopiedStyles(node.styles);
          // Simple visual feedback
          alert('Styles copied!');
      }
  };

  const handlePasteStyles = (id: string) => {
      if (copiedStyles) {
          handleUpdateNode(id, { styles: copiedStyles });
      } else {
          alert('No styles copied yet.');
      }
  };


  const handlePublishSuccess = (updatedData: WebsiteData) => {
    setWebsiteData(draft => updatedData);
  };
  
  const handleGenerateSectionContent = async (sectionId: string) => {
    if (!websiteData) return;

    const section = findNodeById(websiteData.children, sectionId);
    if (!section || section.type !== 'section') {
        alert("Can only generate content for a section.");
        return;
    }

    setGeneratingSectionId(sectionId);
    try {
        const elementsByColumn = await generateSectionContent(websiteData, section as Section);
        
        setWebsiteData(draft => {
            if (!draft) return;
            const targetSection = findNodeById(draft.children, sectionId) as Section | null;
            if (targetSection) {
                targetSection.children.forEach((row, rowIndex) => {
                    row.children.forEach((column, colIndex) => {
                         if(elementsByColumn[colIndex]) {
                            // Replace existing elements with new ones, keeping IDs
                            // FIX: Cast the newly created element object to the `Element` type to resolve the discriminated union type inference issue.
                            column.children = elementsByColumn[colIndex].map((newElementData: Omit<Element, 'id' | 'styles'>) => ({
                                id: uuidv4(),
                                styles: { desktop: {}, tablet: {}, mobile: {} },
                                ...newElementData
                            }) as Element);
                         }
                    });
                });
            }
        });

    } catch (error) {
        alert(error instanceof Error ? error.message : "An unknown error occurred during content generation.");
    } finally {
        setGeneratingSectionId(null);
    }
};


  const selectedNode = selectedNodeId && websiteData ? findNodeById(websiteData.children, selectedNodeId) : null;

  if (error) return <div className="flex justify-center items-center h-screen text-red-600">{error}</div>;
  if (!websiteData) return <div className="flex justify-center items-center h-screen">Loading Editor...</div>;
  
  const tabs = [
    { id: 'layers', icon: LayersIcon, label: 'Layers' },
    { id: 'add', icon: ComponentIcon, label: 'Add' },
    { id: 'style', icon: PencilIcon, label: 'Style' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <div className="editor-container">
        <EditorTopBar 
            websiteName={websiteData.name}
            device={device}
            onSetDevice={setDevice}
            onPublish={() => setIsPublishModalOpen(true)}
            isSaving={isSaving}
            lastSaved={lastSaved}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
        />
        <div className="editor-main">
            <aside className="editor-sidebar">
                <div className="sidebar-tabs">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}>
                           <tab.icon className="w-5 h-5"/> {tab.label}
                        </button>
                    ))}
                </div>
                <div className="sidebar-content">
                    {activeTab === 'layers' && <LayersPanel nodes={websiteData.children} selectedNodeId={selectedNodeId} copiedNodeId={copiedStyles ? 'copied' : null} onSelectNode={handleSelectNode} onDeleteNode={handleRemoveNode} onMoveNode={handleMoveNode} onCopyStyles={handleCopyStyles} onPasteStyles={handlePasteStyles} onGenerateSectionContent={handleGenerateSectionContent} generatingSectionId={generatingSectionId} />}
                    {activeTab === 'add' && <AddPanel onAddElement={handleAddElementToSelected} />}
                    {activeTab === 'style' && (
                        selectedNode ? <StylePanel node={selectedNode} onUpdate={handleUpdateNode} websiteData={websiteData} /> : <div className="p-4 text-center text-slate-500">Select an element to style.</div>
                    )}
                    {activeTab === 'settings' && <GlobalSettingsForm websiteData={websiteData} setWebsiteData={setWebsiteData} onAddSection={() => handleAddNode(websiteData.id, 'section')} />}
                </div>
            </aside>
            
            <main className="editor-preview-wrapper">
                <div className={`preview-canvas preview-canvas-${device}`}>
                <Preview 
                    websiteData={websiteData} 
                    interactive={true}
                    device={device}
                    selectedNodeId={selectedNodeId}
                    hoveredNodeId={hoveredNodeId}
                    onSelectNode={handleSelectNode}
                    onHoverNode={setHoveredNodeId}
                    onUpdateNode={handleUpdateNode}
                />
                </div>
            </main>
        </div>

      {isPublishModalOpen && (
          <PublishModal 
              username={session.username!}
              websiteData={websiteData}
              onClose={() => setIsPublishModalOpen(false)}
              onPublishSuccess={handlePublishSuccess}
          />
      )}
    </div>
  );
};

export default Editor;
