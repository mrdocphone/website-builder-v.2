import React, { useState, useEffect, useRef, useMemo } from 'react';
import { XIcon } from './icons';

export interface Command {
  id: string;
  label: string;
  action: () => void;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  keywords?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredCommands = useMemo(() => {
    if (!searchTerm) return commands;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(lowerCaseSearch) ||
      cmd.keywords?.toLowerCase().includes(lowerCaseSearch)
    );
  }, [searchTerm, commands]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    // Scroll the selected item into view
    const selectedItem = listRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);
  
  const handleItemClick = (command: Command) => {
    command.action();
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a command or search..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div ref={listRef} className="command-palette-list">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => (
              <div
                key={cmd.id}
                className={`command-palette-item ${selectedIndex === index ? 'selected' : ''}`}
                onClick={() => handleItemClick(cmd)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <cmd.icon className="w-5 h-5 text-slate-500" />
                <span>{cmd.label}</span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-slate-500">No results found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
