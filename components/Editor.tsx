import React, { useState, useCallback, useMemo } from 'react';
import { useImmer } from 'use-immer';
import { v4 as uuidv4 } from 'uuid';
import type { WebsiteData, Element, ElementType, Section, Row, Column, WebsiteNode } from '../types';
import type { Session } from '../App';
import Preview from './Preview';
// FIX: Changed import to named import to resolve compilation issue.
import { StylePanel } from './EditorSectionItem'; // Repurposed as StylePanel
import AddElementModal from './PublishModal'; // Repurposed as AddElementModal
import { findNode, findParentNode } from '../utils/tree';
import { LinkIcon, ClipboardCopyIcon, XIcon, WarningIcon } from './icons';

// Helper to create new elements with default values
const createNewElement = (type: ElementType): Element => {
  const id = uuidv4();
  switch (type) {
    case 'headline':
      return { id, type, styles: { paddingTop: '10px', paddingBottom: '10px', textAlign: 'center' }, content: { text: 'New Headline', level: 'h2' } };
    case 'text':
      return { id, type, styles: { paddingTop: '10px', paddingBottom: '10px' }, content: { text: 'This is a new paragraph. Double click to edit the text.' } };
    case 'image':
      return { id, type, styles: { paddingTop: '10px', paddingBottom: '10px' }, content: { src: `https://picsum.photos/seed/${id}/600/400`, alt: 'Placeholder image' } };
    case 'button':
       return { id, type, styles: { paddingTop: '10px', paddingBottom: '10px', textAlign: 'center' }, content: { text: 'Click Me', href: '#' } };
    default:
      throw new Error('Unknown element type');
  }
};

type PublishStatus = 'idle' | 'loading' | 'success' | 'error';

// --- New Publish Modal Component (defined in-file to avoid adding new files) ---
const PublishModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onPublish: () => void;
    status: PublishStatus;
    error: string | null;
    url: string;
}> = ({ isOpen, onClose, onPublish, status, error, url }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    const renderContent = () => {
        switch (status) {
            case 'loading':
                return <div className="text-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div><p className="mt-4 text-slate-600">Publishing your site...</p></div>;
            case 'error':
                return <div className="text-center"><WarningIcon className="w-12 h-12 text-red-500 mx-auto" /><p className="mt-4 font-semibold text-red-600">Publishing Failed</p><p className="mt-2 text-sm text-slate-600">{error}</p></div>;
            case 'success':
                return (
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-green-600">Published Successfully!</h3>
                        <p className="mt-2 text-slate-600">Your website is now live at the address below.</p>
                        <div className="mt-4 flex items-center bg-slate-100 rounded-md p-2 border border-slate-200">
                           <input type="text" readOnly value={url} className="flex-grow bg-transparent text-sm text-slate-700 focus:outline-none" />
                           <button onClick={handleCopy} className="ml-2 px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                               {copied ? 'Copied!' : 'Copy'}
                           </button>
                        </div>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800">
                            Visit Site <LinkIcon className="w-4 h-4 ml-1"/>
                        </a>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <>
                        <p className="text-slate-600">Your website will be published at:</p>
                        <p className="my-2 font-mono text-center bg-slate-100 p-2 rounded-md text-sm break-all">{url}</p>
                        <p className="text-sm text-slate-500 mt-2">Are you sure you want to publish the latest changes?</p>
                        <button onClick={onPublish} className="mt-6 w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            Publish Now
                        </button>
                    </>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"><XIcon className="w-6 h-6" /></button>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Publish Website</h2>
                {renderContent()}
            </div>
        </div>
    );
};


interface EditorProps {
  websiteData: WebsiteData;
  setWebsiteData: React.Dispatch<React.SetStateAction<WebsiteData>>;
  onLogout: () => void;
  session: Session;
}

const Editor: React.FC<EditorProps> = ({ websiteData: initialData, setWebsiteData: syncToServer, onLogout, session }) => {
  const [data, setData] = useImmer<WebsiteData>(initialData);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // State for AddElementModal
  const [isAddElementModalOpen, setAddElementModalOpen] = useState(false);
  const [addElementTargetColumnId, setAddElementTargetColumnId] = useState<string | null>(null);

  // State for new PublishModal
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);
  const [publishStatus, setPublishStatus] = useState<PublishStatus>('idle');
  const [publishError, setPublishError] = useState<string | null>(null);


  // Debounced effect to save data to the server
  React.useEffect(() => {
     const handler = setTimeout(() => {
       syncToServer(data);
     }, 1000);
     return () => clearTimeout(handler);
  }, [data, syncToServer]);
  
  const handlePublish = async () => {
    setPublishStatus('loading');
    setPublishError(null);
    try {
      if (!session.username) throw new Error("User session not found.");
      const response = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteData: data, username: session.username }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to publish.');
      setPublishStatus('success');
    } catch (e) {
      setPublishStatus('error');
      setPublishError(e instanceof Error ? e.message : 'An unknown error occurred.');
    }
  };
  
  const handleOpenPublishModal = () => {
    setPublishStatus('idle');
    setPublishError(null);
    setPublishModalOpen(true);
  };

  const handleSelectElement = useCallback((id: string) => {
    setSelectedElementId(id);
  }, []);
  
  const handleDeselect = useCallback((e: React.MouseEvent) => {
    // Deselect if clicking on the preview background
    if (e.target === e.currentTarget) {
      setSelectedElementId(null);
    }
  }, []);

  const handleNodeChange = useCallback((nodeId: string, updates: Partial<WebsiteNode>) => {
    setData(draft => {
      // Handle global website data changes
      if (nodeId === 'root') {
        Object.assign(draft, updates);
        return;
      }
      const node = findNode(draft, nodeId);
      if (node) {
        Object.assign(node, updates);
      }
    });
  }, [setData]);

  const handleAddSection = useCallback(() => {
    setData(draft => {
      draft.children.push({
        id: uuidv4(),
        type: 'section',
        styles: { paddingTop: '40px', paddingBottom: '40px', backgroundColor: '#ffffff' },
        children: [{
          id: uuidv4(),
          type: 'row',
          styles: {},
          children: [{
            id: uuidv4(),
            type: 'column',
            styles: {},
            children: []
          }]
        }]
      });
    });
  }, [setData]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (window.confirm("Are you sure you want to delete this element?")) {
      setData(draft => {
        const parent = findParentNode(draft, nodeId);
        if (parent && 'children' in parent) {
          (parent.children as any[]) = parent.children.filter(child => child.id !== nodeId);
        }
      });
      setSelectedElementId(null);
    }
  }, [setData]);
  
  const handleOpenAddElementModal = useCallback((columnId: string) => {
      setAddElementTargetColumnId(columnId);
      setAddElementModalOpen(true);
  }, []);

  const handleAddElement = useCallback((type: ElementType) => {
    if (addElementTargetColumnId) {
        setData(draft => {
            const column = findNode(draft, addElementTargetColumnId);
            if (column && column.type === 'column') {
                column.children.push(createNewElement(type));
            }
        });
    }
    setAddElementModalOpen(false);
    setAddElementTargetColumnId(null);
  }, [addElementTargetColumnId, setData]);

  const selectedElement = useMemo(() => {
    return selectedElementId ? findNode(data, selectedElementId) : null;
  }, [selectedElementId, data]);

  const publishUrl = useMemo(() => {
    if (typeof window !== 'undefined' && session.username) {
      return `${window.location.origin}/${session.username}/${data.slug || ''}`.replace(/\/$/, '');
    }
    return '';
  }, [session.username, data.slug]);


  return (
    <>
    {isAddElementModalOpen && <AddElementModal onAdd={handleAddElement} onClose={() => setAddElementModalOpen(false)} />}
    <PublishModal 
        isOpen={isPublishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        onPublish={handlePublish}
        status={publishStatus}
        error={publishError}
        url={publishUrl}
    />
    <div className="editor-container">
      <aside className="editor-sidebar">
         <StylePanel 
            selectedNode={selectedElement}
            websiteData={data}
            onNodeChange={handleNodeChange}
            onAddSection={handleAddSection}
            onLogout={onLogout}
            session={session}
            onOpenPublishModal={handleOpenPublishModal}
         />
      </aside>
      <main className="editor-preview" onClick={handleDeselect}>
        <div className="preview-canvas">
            <Preview 
                websiteData={data} 
                isEditor={true}
                selectedElementId={selectedElementId}
                onSelectElement={handleSelectElement}
                onNodeChange={handleNodeChange}
                onDeleteNode={handleDeleteNode}
                onOpenAddElementModal={handleOpenAddElementModal}
            />
        </div>
      </main>
    </div>
    </>
  );
};

export default Editor;
