
import React, { useState, useEffect, useCallback } from 'react';
import { useImmer } from 'use-immer';
import { v4 as uuidv4 } from 'uuid';
import type { WebsiteData, WebsiteNode, Section, Session } from '../types';
import { findNodeById, updateNodeById, removeNodeById, addNode } from '../utils/tree';
import GlobalSettingsForm from './GlobalSettingsForm';
import SectionEditorForm from './SectionEditorForm';
import Preview from './Preview';
import PublishModal from './PublishModal';

const defaultWebsiteData: WebsiteData = {
  businessName: 'My Awesome Business',
  tagline: 'The best products you have ever seen.',
  slug: 'home',
  theme: 'light',
  heroImageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop',
  children: [
    {
      id: uuidv4(),
      type: 'section',
      styles: { paddingTop: '2rem', paddingBottom: '2rem' },
      children: [
        {
          id: uuidv4(),
          type: 'row',
          styles: {},
          children: [
            {
              id: uuidv4(),
              type: 'column',
              styles: {},
              children: [
                { id: uuidv4(), type: 'headline', styles: { textAlign: 'center' }, content: { level: 'h2', text: 'About Us' } },
                { id: uuidv4(), type: 'text', styles: {}, content: { text: 'We are a company dedicated to providing the highest quality products and services. Our team is passionate and experienced.' } }
              ]
            }
          ]
        }
      ]
    }
  ]
};

const Editor: React.FC<{session: Session}> = ({ session }) => {
  const [websiteData, setWebsiteData] = useImmer<WebsiteData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!session.username) return;
      try {
        const res = await fetch(`/api/editor-data?username=${session.username}`);
        if (res.ok) {
          const data = await res.json();
          setWebsiteData(data);
        } else {
          setWebsiteData(defaultWebsiteData);
        }
      } catch (e) {
        console.error("Failed to load editor data", e);
        setWebsiteData(defaultWebsiteData);
      }
    };
    loadData();
  }, [session.username, setWebsiteData]);

  const handleSave = useCallback(async () => {
    if (!websiteData || !session.username) return;
    setIsSaving(true);
    try {
      await fetch('/api/editor-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: session.username, websiteData })
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save data:', error);
    } finally {
      setIsSaving(false);
    }
  }, [websiteData, session.username]);

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

  if (!websiteData) {
    return <div className="flex justify-center items-center h-screen">Loading Editor...</div>;
  }

  return (
    <div className="editor-container">
      <aside className="editor-sidebar">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Editor</h2>
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
