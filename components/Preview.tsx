import React, { useMemo } from 'react';
import type { WebsiteData, ThemeConfig, Theme, Section, Row, Column, Element as ElementType, WebsiteNode } from '../types';
import Element from './SectionEditorForm'; // Repurposed as Element renderer
import { PlusIcon, TrashIcon } from './icons';

interface InteractiveWrapperProps {
  children: React.ReactNode;
  node: WebsiteNode;
  isEditor: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const InteractiveWrapper: React.FC<InteractiveWrapperProps> = React.memo(({ children, node, isEditor, isSelected, onSelect, onDelete }) => {
  if (!isEditor) {
    return <div style={node.styles}>{children}</div>;
  }

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(node.id);
  }

  return (
    <div
      onClick={handleSelect}
      style={node.styles}
      className={`interactive-wrapper ${isSelected ? 'selected' : ''}`}
    >
      {isSelected && (
        <div className="element-toolbar">
          <span className="capitalize">{node.type}</span>
          <button onClick={handleDelete} title={`Delete ${node.type}`}>
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      )}
      {children}
    </div>
  );
});

interface PreviewProps {
  websiteData: WebsiteData;
  isEditor: boolean;
  selectedElementId?: string | null;
  onSelectElement?: (id: string) => void;
  onNodeChange?: (nodeId: string, updates: Partial<WebsiteNode>) => void;
  onDeleteNode?: (nodeId: string) => void;
  onOpenAddElementModal?: (columnId: string) => void;
}

const themeConfigs: Record<Theme, ThemeConfig> = {
  light: { bg: 'bg-white', text: 'text-slate-700', primary: 'bg-indigo-600', primaryText: 'text-white', secondary: 'bg-slate-50', footerBg: 'bg-slate-800', footerText: 'text-slate-200', headerText: 'text-slate-800' },
  dark: { bg: 'bg-gray-800', text: 'text-gray-200', primary: 'bg-indigo-500', primaryText: 'text-white', secondary: 'bg-gray-700', footerBg: 'bg-black', footerText: 'text-gray-300', headerText: 'text-white' },
  ocean: { bg: 'bg-blue-50', text: 'text-blue-900', primary: 'bg-blue-600', primaryText: 'text-white', secondary: 'bg-blue-100', footerBg: 'bg-blue-900', footerText: 'text-blue-100', headerText: 'text-blue-900' },
  forest: { bg: 'bg-green-50', text: 'text-green-900', primary: 'bg-green-700', primaryText: 'text-white', secondary: 'bg-green-100', footerBg: 'bg-green-900', footerText: 'text-green-100', headerText: 'text-green-900' },
};

const Preview: React.FC<PreviewProps> = ({
  websiteData,
  isEditor,
  selectedElementId = null,
  // FIX: Provide default functions with the correct signatures to match their usage.
  onSelectElement = (id: string) => {},
  onNodeChange = (nodeId: string, updates: Partial<WebsiteNode>) => {},
  onDeleteNode = (nodeId: string) => {},
  onOpenAddElementModal = (columnId: string) => {},
}) => {
  const theme = useMemo(() => themeConfigs[websiteData.theme] || themeConfigs.light, [websiteData.theme]);

  const renderNode = (node: WebsiteNode): React.ReactNode => {
    const isSelected = node.id === selectedElementId;

    return (
      <InteractiveWrapper
        node={node}
        isEditor={isEditor}
        isSelected={isSelected}
        onSelect={onSelectElement}
        onDelete={onDeleteNode}
      >
        {'children' in node ? (
          <div className={node.type === 'row' ? 'flex' : ''}>
            {(node.children as any[]).map(child => <div key={child.id} className={child.type === 'column' ? 'flex-1' : ''}>{renderNode(child)}</div>)}
            {isEditor && node.type === 'column' && node.children.length === 0 && (
                <div className="empty-column-placeholder">
                    <button onClick={(e) => { e.stopPropagation(); onOpenAddElementModal(node.id); }} className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                        <PlusIcon className="w-4 h-4 mr-1"/> Add Element
                    </button>
                </div>
            )}
          </div>
        ) : (
          <Element 
            element={node as ElementType} 
            isEditor={isEditor}
            onContentChange={(newContent) => onNodeChange(node.id, { content: newContent })}
          />
        )}
      </InteractiveWrapper>
    );
  };

  return (
    <div className={`w-full h-full overflow-y-auto ${theme.bg} ${theme.text} transition-colors duration-300`}>
      {/* Header */}
      <header className={`p-6 sticky top-0 ${theme.bg} bg-opacity-80 backdrop-blur-sm z-20`}>
        <h1 className={`text-2xl font-bold ${theme.headerText}`}>{websiteData.businessName}</h1>
      </header>

      {/* Hero Section */}
      <section className="relative h-72">
        <img src={websiteData.heroImageUrl} alt={`${websiteData.businessName} hero image`} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center p-6">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-white">{websiteData.businessName}</h2>
            <p className="mt-2 text-lg text-slate-200">{websiteData.tagline}</p>
          </div>
        </div>
      </section>

      {/* Dynamic Sections */}
      <main>
        {websiteData.children.map(section => (
          <div key={section.id}>{renderNode(section)}</div>
        ))}
      </main>

      {/* Footer */}
      <footer className={`py-6 px-6 text-center ${theme.footerBg} ${theme.footerText}`}>
        <p>&copy; {new Date().getFullYear()} {websiteData.businessName}. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default React.memo(Preview);