import React, { useState, useCallback, useMemo } from 'react';
import { useImmer } from 'use-immer';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { WebsiteData, Element, ElementType, Section, Row, Column, WebsiteNode } from '../types';
import type { Session } from '../App';
import Preview from './Preview';
import StylePanel from './EditorSectionItem'; // Repurposed as StylePanel
import AddElementModal from './PublishModal'; // Repurposed as AddElementModal
import { findNode, findParentNode } from '../utils/tree';

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

interface EditorProps {
  websiteData: WebsiteData;
  setWebsiteData: React.Dispatch<React.SetStateAction<WebsiteData>>;
  onLogout: () => void;
  session: Session;
}

const Editor: React.FC<EditorProps> = ({ websiteData: initialData, setWebsiteData: syncToServer, onLogout, session }) => {
  const [data, setData] = useImmer<WebsiteData>(initialData);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isAddElementModalOpen, setAddElementModalOpen] = useState(false);
  const [addElementTargetColumnId, setAddElementTargetColumnId] = useState<string | null>(null);
  
  const navigate = useNavigate();

  // Debounced effect to save data to the server
  React.useEffect(() => {
     const handler = setTimeout(() => {
       syncToServer(data);
     }, 1000);
     return () => clearTimeout(handler);
  }, [data, syncToServer]);

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

  return (
    <>
    {isAddElementModalOpen && <AddElementModal onAdd={handleAddElement} onClose={() => setAddElementModalOpen(false)} />}
    <div className="editor-container">
      <aside className="editor-sidebar">
         <StylePanel 
            selectedNode={selectedElement}
            websiteData={data}
            onNodeChange={handleNodeChange}
            onAddSection={handleAddSection}
            onLogout={onLogout}
            session={session}
            navigate={navigate}
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