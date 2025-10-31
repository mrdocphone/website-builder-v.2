import React, { useState, useEffect, useCallback } from 'react';
import { useImmer } from 'use-immer';
import { useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { WebsiteData, WebsiteNode, Section, Session } from '../types';
import { findNodeById, updateNodeById, removeNodeById, addNode } from '../utils/tree';
import GlobalSettingsForm from './GlobalSettingsForm';
import SectionEditorForm from './SectionEditorForm';
import Preview from './Preview';
import PublishModal from './PublishModal';

const Editor: React.FC<{session: Session}> = ({ session }) => {
  const { websiteId } = useParams<{ websiteId: string }>();
  const [websiteData, setWebsiteData] = useImmer<WebsiteData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!websiteId) {
          setError("No website ID provided.");
          return;
      };
      setError(null);
      setWebsiteData(null); // Reset while loading
      try {
        const res = await fetch(`/api/editor-data?websiteId=${websiteId}`);
        if (res.ok) {
          const data = await res.json();
          setWebsiteData(data);
        } else {
          const errorData = await res.json();
          setError(errorData.message || "Could not load website data. It may have been deleted.");
        }
      } catch (e) {
        console.error("Failed to load editor data", e);
        setError("An error occurred while trying to load your website.");
      }
    };
    loadData();
  }, [websiteId, setWebsiteData]);

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
    } catch (error) {
      console.error('Failed to save data:', error);
    } finally {
      setIsSaving(false);
    }
  }, [websiteData, session.username, websiteId]);

  useEffect(() => {
    const timer = setTimeout(() => {
        handleSave();
    }, 2000); // Autosave every 2 seconds
    return () => clearTimeout(timer);
  }, [websiteData, handleSave]);


  const handleSelectNode = (id: string | null) => {
    setSelectedNodeId(id);
  };

  const handleUpdateNode = (id: string, updates: Partial<WebsiteNode>) => {
    setWebsiteData(draft => {
      if (draft) {
        updateNodeById(draft.children, id, updates);
      }
    });
  };

  const handleRemoveNode = (id: string) => {
    setWebsiteData(draft => {
      if (draft) {
        removeNodeById(draft.children, id);
      }
    });
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
    }
  };

  const handleAddSection = () => {
    setWebsiteData(draft => {
      if (draft) {
        const newSection: Section = {
          id: uuidv4(),
          type: 'section',
          styles: { paddingTop: '2rem', paddingBottom: '2rem' },
          children: []
        };
        draft.children.push(newSection);
      }
    });
  };

  const handleAddElement = (parentId: string, type: 'row' | 'column' | 'headline' | 'text' | 'image' | 'button') => {
      setWebsiteData(draft => {
          if(!draft) return;
          addNode(draft, parentId, type);
      })
  }

  const selectedNode = selectedNodeId && websiteData ? findNodeById(websiteData.children, selectedNodeId) : null;

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-600 font-semibold p-4 text-center">{error}</div>;
  }
  if (!websiteData) {
    return <div className="flex justify-center items-center h-screen">Loading Editor...</div>;
  }

  return (
    <div className="editor-container">
      <aside className="editor-sidebar">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">{websiteData.name}</h2>
          <div className="text-xs text-slate-500 h-4">
              {isSaving ? 'Saving...' : lastSaved ? `Last saved: ${lastSaved.toLocaleTimeString()}` : ''}
          </div>
        </div>
        
        <div className="p-4">
            <button
                onClick={() => setIsPublishModalOpen(true)}
                className="w-full bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700"
            >
                Publish
            </button>
        </div>

        <div className="flex-grow overflow-y-auto">
            {selectedNode ? (
                <SectionEditorForm 
                    node={selectedNode} 
                    websiteData={websiteData}
                    onUpdate={handleUpdateNode}
                    onDelete={handleRemoveNode} 
                    onAddElement={handleAddElement}
                    onDeselect={() => setSelectedNodeId(null)}
                />
            ) : (
                <GlobalSettingsForm 
                    websiteData={websiteData} 
                    setWebsiteData={setWebsiteData}
                    onAddSection={handleAddSection} 
                />
            )}
        </div>
      </aside>
      
      <main className="editor-preview">
        <div className="preview-canvas">
          <Preview 
            websiteData={websiteData} 
            interactive={true}
            selectedNodeId={selectedNodeId}
            hoveredNodeId={hoveredNodeId}
            onSelectNode={handleSelectNode}
            onHoverNode={setHoveredNodeId}
            onAddElement={handleAddElement}
          />
        </div>
      </main>

      {isPublishModalOpen && (
          <PublishModal 
              username={session.username!}
              websiteData={websiteData}
              onClose={() => setIsPublishModalOpen(false)}
          />
      )}
    </div>
  );
};

export default Editor;