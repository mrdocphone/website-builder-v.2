import React from 'react';
import type { WebsiteNode, Styles, WebsiteData, Theme } from '../types';
import type { Session } from '../App';
import GlobalSettingsForm from './GlobalSettingsForm';
import {
  LinkIcon, LogoutIcon, PlusIcon,
  SpacingIcon, TypographyIcon, BackgroundIcon, LayoutIcon,
  AlignLeftIcon, AlignCenterIcon, AlignRightIcon
} from './icons';

interface StylePanelProps {
  selectedNode: WebsiteNode | null;
  websiteData: WebsiteData;
  onNodeChange: (nodeId: string, updates: Partial<WebsiteNode>) => void;
  onAddSection: () => void;
  onLogout: () => void;
  session: Session;
  navigate: (path: string) => void;
}

const StyleEditor: React.FC<{ node: WebsiteNode, onNodeChange: (id: string, updates: Partial<WebsiteNode>) => void }> = ({ node, onNodeChange }) => {
  
  const handleStyleChange = (prop: keyof Styles, value: string) => {
    const newStyles = { ...node.styles, [prop]: value };
    onNodeChange(node.id, { styles: newStyles });
  };
  
  const baseInputClass = "w-full p-2 border border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm";
  const baseLabelClass = "text-sm font-medium text-slate-600 block mb-1";

  return (
    <div className="p-4">
      <h3 className="font-semibold text-slate-800 text-lg mb-4">Editing: <span className="capitalize">{node.type}</span></h3>
      
      <div className="space-y-4">
         {/* Layout Controls */}
        {(node.type === 'section' || node.type === 'column') && (
            <div>
                 <h4 className="font-medium text-slate-600 mb-2 flex items-center"><LayoutIcon className="w-4 h-4 mr-2" /> Layout</h4>
                 {/* Column management could go here */}
            </div>
        )}
        
        {/* Spacing Controls */}
        <div>
          <h4 className="font-medium text-slate-600 mb-2 flex items-center"><SpacingIcon className="w-4 h-4 mr-2" /> Spacing</h4>
          <div className="grid grid-cols-2 gap-2">
            <div><label className={baseLabelClass}>Padding Top</label><input type="text" value={node.styles.paddingTop || ''} onChange={e => handleStyleChange('paddingTop', e.target.value)} className={baseInputClass} placeholder="0px"/></div>
            <div><label className={baseLabelClass}>Padding Bottom</label><input type="text" value={node.styles.paddingBottom || ''} onChange={e => handleStyleChange('paddingBottom', e.target.value)} className={baseInputClass} placeholder="0px"/></div>
          </div>
        </div>

        {/* Typography Controls */}
        {(node.type === 'headline' || node.type === 'text') && (
          <div>
            <h4 className="font-medium text-slate-600 mb-2 flex items-center"><TypographyIcon className="w-4 h-4 mr-2" /> Typography</h4>
            <div className="space-y-2">
                <div><label className={baseLabelClass}>Color</label><input type="color" value={node.styles.color || '#000000'} onChange={e => handleStyleChange('color', e.target.value)} className="w-full h-8"/></div>
                <div>
                    <label className={baseLabelClass}>Align</label>
                    <div className="flex items-center border border-slate-300 rounded-md">
                        {(['left', 'center', 'right'] as const).map(align => (
                            <button key={align} onClick={() => handleStyleChange('textAlign', align)} className={`p-2 flex-1 ${node.styles.textAlign === align ? 'bg-indigo-500 text-white' : 'bg-white text-slate-500'}`}>
                                {align === 'left' && <AlignLeftIcon className="w-5 h-5 mx-auto"/>}
                                {align === 'center' && <AlignCenterIcon className="w-5 h-5 mx-auto"/>}
                                {align === 'right' && <AlignRightIcon className="w-5 h-5 mx-auto"/>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>
        )}

        {/* Background Controls */}
        {(node.type === 'section' || node.type === 'column' || node.type === 'row') && (
            <div>
                <h4 className="font-medium text-slate-600 mb-2 flex items-center"><BackgroundIcon className="w-4 h-4 mr-2" /> Background</h4>
                <div><label className={baseLabelClass}>Color</label><input type="color" value={node.styles.backgroundColor || '#ffffff'} onChange={e => handleStyleChange('backgroundColor', e.target.value)} className="w-full h-8"/></div>
            </div>
        )}
      </div>
    </div>
  );
};


const StylePanel: React.FC<StylePanelProps> = ({ selectedNode, websiteData, onNodeChange, onAddSection, onLogout, session, navigate }) => {
  const handleGlobalDataChange = (updates: Partial<WebsiteData>) => {
      // This is a bit of a hack since onNodeChange expects an ID. We pass a special ID to signify global changes.
      onNodeChange('root', updates as any);
  }

  return (
    <>
      <div className="p-4 border-b border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-slate-800">Gen-Z Builder</h1>
          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200"
          >
            <LogoutIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex space-x-2">
            <button
              onClick={() => { /* Implement publish */ }}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              <LinkIcon className="w-4 h-4 mr-2" /> Publish
            </button>
            <button 
                onClick={onAddSection}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200"
            >
                <PlusIcon className="w-4 h-4 mr-2" /> Add Section
            </button>
        </div>
      </div>
      
      {selectedNode ? (
        <StyleEditor node={selectedNode} onNodeChange={onNodeChange} />
      ) : (
        <GlobalSettingsForm websiteData={websiteData} onDataChange={handleGlobalDataChange} />
      )}
    </>
  );
};

export default React.memo(StylePanel);
