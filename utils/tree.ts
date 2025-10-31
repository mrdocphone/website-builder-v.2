import { v4 as uuidv4 } from 'uuid';
import type { WebsiteNode, Section, Row, Column, Element, ResponsiveStyles, Page, FormField, NavLink, SocialIconsElement } from '../types';

// Recursive function to find a node by its ID
export function findNodeById(nodes: WebsiteNode[], id: string): WebsiteNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if ('children' in node && node.children) {
      const found = findNodeById(node.children as WebsiteNode[], id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

// NEW: Recursive function to find the path (ancestry) of a node
export function findNodePath(nodes: WebsiteNode[], id: string, path: WebsiteNode[] = []): WebsiteNode[] {
    for (const node of nodes) {
        const currentPath = [...path, node];
        if (node.id === id) {
            return currentPath;
        }
        if ('children' in node && Array.isArray(node.children)) {
            const foundPath = findNodePath(node.children as WebsiteNode[], id, currentPath);
            if (foundPath.length > currentPath.length) { // Path was found deeper
                return foundPath;
            }
        }
    }
    return path; // Return the path so far if not found deeper
}


// Immer-compatible function to update a node
export function updateNodeById(nodes: WebsiteNode[], id: string, updates: Partial<WebsiteNode>): boolean {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.id === id) {
            // Create a copy to avoid direct mutation issues with Immer proxies.
            const updatedNode = { ...node };

            // Apply shallow updates for top-level properties.
            Object.keys(updates).forEach(key => {
                if (key !== 'styles' && key !== 'hoverStyles' && key !== 'content') {
                    (updatedNode as any)[key] = (updates as any)[key];
                }
            });

            // Deep merge content properties.
            if (updates.content) {
                (updatedNode as any).content = { ...node.content, ...updates.content };
            }

            // Perform a robust deep merge for styles to prevent data loss.
            if (updates.styles) {
                updatedNode.styles = {
                    desktop: { ...node.styles.desktop, ...(updates.styles.desktop || {}) },
                    tablet: { ...node.styles.tablet, ...(updates.styles.tablet || {}) },
                    mobile: { ...node.styles.mobile, ...(updates.styles.mobile || {}) },
                };
            }
            
            // Perform a robust deep merge for hover styles.
            if (updates.hoverStyles) {
                updatedNode.hoverStyles = {
                    desktop: { ...(node.hoverStyles?.desktop || {}), ...(updates.hoverStyles.desktop || {}) },
                    tablet: { ...(node.hoverStyles?.tablet || {}), ...(updates.hoverStyles.tablet || {}) },
                    mobile: { ...(node.hoverStyles?.mobile || {}), ...(updates.hoverStyles.mobile || {}) },
                };
            }

            nodes[i] = updatedNode;
            return true;
        }
        if ('children' in node && Array.isArray(node.children)) {
            if (updateNodeById(node.children as WebsiteNode[], id, updates)) {
                return true;
            }
        }
    }
    return false;
}


// Immer-compatible function to remove a node
export function removeNodeById(nodes: WebsiteNode[], id: string): boolean {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.id === id) {
            nodes.splice(i, 1);
            return true;
        }
        if ('children' in node && Array.isArray(node.children)) {
            if (removeNodeById(node.children as WebsiteNode[], id)) {
                return true;
            }
        }
    }
    return false;
}

const createDefaultStyles = (): ResponsiveStyles => ({
    desktop: {},
    tablet: {},
    mobile: {},
});


export const createDefaultElement = (type: Element['type']): Element => {
    const base = { id: uuidv4(), styles: createDefaultStyles(), visibility: { desktop: true, tablet: true, mobile: true } };
    switch(type) {
        case 'headline': return { ...base, type: 'headline', content: { level: 'h2', text: 'New Headline' } };
        case 'text': return { ...base, type: 'text', content: { text: 'New paragraph of text. Click here to edit.' } };
        case 'image': return { ...base, type: 'image', content: { src: 'https://images.unsplash.com/photo-1554629947-334ff61d85dc?q=80&w=2072&auto=format&fit=crop', alt: 'Mountain landscape' } };
        case 'button': return { ...base, type: 'button', content: { text: 'Click Me', href: '#' } };
        case 'spacer': return { ...base, type: 'spacer', content: {}, styles: { desktop: { height: '2rem'}, tablet: {}, mobile: {} }};
        case 'icon': return { ...base, type: 'icon', content: { name: 'star' } };
        case 'video': return { ...base, type: 'video', content: { src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', controls: true } };
        case 'form': return { ...base, type: 'form', content: { buttonText: 'Submit', fields: [ { id: uuidv4(), type: 'text', label: 'Name', required: true}, { id: uuidv4(), type: 'email', label: 'Email', required: true } ] } };
        case 'embed': return { ...base, type: 'embed', content: { html: '<p class="p-4 bg-slate-100 rounded text-center">Your embedded content will show here.</p>' } };
        case 'navigation': return { ...base, type: 'navigation', content: { links: [] } };
        case 'gallery': return { ...base, type: 'gallery', content: { images: [ { src: 'https://images.unsplash.com/photo-1599420186946-7b6fb4e297f0?q=80&w=1887', alt: 'Placeholder 1'}, { src: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a1c8?q=80&w=1887', alt: 'Placeholder 2'}, { src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070', alt: 'Placeholder 3'}, { src: 'https://images.unsplash.com/photo-1620712943543-2858200f7426?q=80&w=2070', alt: 'Placeholder 4'} ]} };
        case 'divider': return { ...base, type: 'divider', content: {}, styles: { desktop: { height: '1px', backgroundColor: '#cbd5e1', marginTop: '1rem', marginBottom: '1rem' }, tablet: {}, mobile: {} } };
        case 'map': return { ...base, type: 'map', content: { embedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.610224424263!2d-73.98785368459384!3d40.74844097932824!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a163!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1676231998539!5m2!1sen!2sus' } };
        case 'accordion': return { ...base, type: 'accordion', content: { items: [ {id: uuidv4(), title: "Item 1", content: "Content for item 1"}, {id: uuidv4(), title: "Item 2", content: "Content for item 2"} ]}};
        case 'tabs': return { ...base, type: 'tabs', content: { items: [ {id: uuidv4(), title: "Tab 1", content: [createDefaultElement('text')]}, {id: uuidv4(), title: "Tab 2", content: [createDefaultElement('text')]} ]}};
        case 'socialIcons': return { ...base, type: 'socialIcons', content: { networks: [ { id: uuidv4(), network: 'twitter', url: '#' }, { id: uuidv4(), network: 'facebook', url: '#' }, { id: uuidv4(), network: 'instagram', url: '#' } ]}};
    }
}


// Immer-compatible function to add a new node
export const addNode = (draft: { children: WebsiteNode[] }, parentId: string, type: 'section' | 'row' | 'column' | Element['type']) => {
    // Handle adding a section to the root (the page)
    if (draft.children.find(c => c.id === parentId) && type === 'section') {
        const newSection: Section = { id: uuidv4(), type: 'section', styles: createDefaultStyles(), children: [], visibility: { desktop: true, tablet: true, mobile: true } };
        draft.children.push(newSection);
        return;
    }
    
    const parent = findNodeById(draft.children, parentId);
    if (!parent || !('children' in parent) || !Array.isArray(parent.children)) return;

    if (type === 'section') {
        return;
    }
    
    let newNode: Row | Column | Element;

    switch (type) {
        case 'row':
            newNode = { id: uuidv4(), type: 'row', styles: createDefaultStyles(), children: [], visibility: { desktop: true, tablet: true, mobile: true } };
            (parent as Section).children.push(newNode);
            break;
        case 'column':
            newNode = { id: uuidv4(), type: 'column', styles: { desktop: { flexBasis: '100%'}, tablet: {}, mobile: {} }, children: [], visibility: { desktop: true, tablet: true, mobile: true } };
             (parent as Row).children.push(newNode);
             // When adding a column, adjust siblings' flexBasis if needed
             const numCols = (parent as Row).children.length;
             const basis = `${100 / numCols}%`;
             (parent as Row).children.forEach(col => {
                if(!col.styles.desktop) col.styles.desktop = {};
                col.styles.desktop.flexBasis = basis;
             });
            break;
        default: // Element types
             newNode = createDefaultElement(type);
             (parent as Column).children.push(newNode);
             break;
    }
};

// Deep copy a node and assign new IDs to it and all its children.
export function deepCloneWithNewIds(node: any): any {
    const newNode = { ...node, id: uuidv4() };

    if (Array.isArray(newNode.children)) {
        newNode.children = newNode.children.map(deepCloneWithNewIds);
    }
    
    // Also handle nested content structures like Tabs and Accordions
    if (typeof newNode.content === 'object' && newNode.content !== null) {
        if (Array.isArray(newNode.content.items)) {
            newNode.content.items = newNode.content.items.map((item: any) => {
                 const newItem = {...item, id: uuidv4()};
                 if (Array.isArray(newItem.content)) { // For Tabs
                     newItem.content = newItem.content.map(deepCloneWithNewIds);
                 }
                 return newItem;
            });
        }
        if (Array.isArray(newNode.content.fields)) { // For Forms
            newNode.content.fields = newNode.content.fields.map((field: FormField) => ({
                ...field,
                id: uuidv4(),
            }));
        }
        // FIX: Added handling for Social Icons which was previously missing, preventing data corruption on duplicate.
        if (Array.isArray(newNode.content.networks)) { // For Social Icons
            newNode.content.networks = newNode.content.networks.map((network: SocialIconsElement['content']['networks'][0]) => ({
                ...network,
                id: uuidv4(),
            }));
        }
        // FIX: Added handling for Navigation links which was previously missing.
        if (Array.isArray(newNode.content.links)) { // For Navigation
             newNode.content.links = newNode.content.links.map((link: NavLink) => ({
                ...link,
                id: uuidv4(),
            }));
        }
    }


    return newNode;
}

// Finds a node, duplicates it, and inserts the copy next to the original.
export function duplicateNodeById(nodes: WebsiteNode[], id: string): boolean {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.id === id) {
            const duplicatedNode = deepCloneWithNewIds(node);
            nodes.splice(i + 1, 0, duplicatedNode);
            return true;
        }
        if ('children' in node && Array.isArray(node.children)) {
            if (duplicateNodeById(node.children as WebsiteNode[], id)) {
                return true;
            }
        }
    }
    return false;
}

// --- Drag and Drop Logic ---

interface NodeLocation {
  parent: (WebsiteNode & { children: WebsiteNode[] }) | { children: WebsiteNode[] };
  node: WebsiteNode;
  index: number;
}
// Finds a node and its parent container. The root is represented as a simple object with a `children` property.
export const findNodeAndParent = (root: WebsiteNode[], id: string): NodeLocation | null => {
    const parentStack: ((WebsiteNode & { children: any[] }) | { children: WebsiteNode[] })[] = [{ children: root }];

    while (parentStack.length > 0) {
        const currentParent = parentStack.pop()!;
        if (!currentParent.children) continue;

        for (let i = 0; i < currentParent.children.length; i++) {
            const node = currentParent.children[i];
            if (node.id === id) {
                return { parent: currentParent, node, index: i };
            }
            if ('children' in node && Array.isArray(node.children)) {
                parentStack.push(node as any);
            }
        }
    }
    return null;
}


// Defines what node types can be dropped into which parent types.
const validChildrenMap: Record<string, string[]> = {
    root: ['section'],
    page: ['section'], // Page is the new root
    section: ['row'],
    row: ['column'],
    column: ['headline', 'text', 'image', 'button', 'spacer', 'icon', 'video', 'form', 'embed', 'navigation', 'gallery', 'divider', 'map', 'accordion', 'tabs', 'socialIcons'],
};

// NEW: Export a function to check drop validity
export function isDropAllowed(sourceType: string, targetParentType: string): boolean {
    const allowedChildren = validChildrenMap[targetParentType];
    return allowedChildren?.includes(sourceType) ?? false;
}


export const moveNode = (root: WebsiteNode[], sourceId: string, targetId: string, position: 'before' | 'after') => {
    if (sourceId === targetId) return;

    const sourceLocation = findNodeAndParent(root, sourceId);
    const targetLocation = findNodeAndParent(root, targetId);

    if (!sourceLocation || !targetLocation) return;
    
    const { parent: sourceParent, node: sourceNode, index: sourceIndex } = sourceLocation;
    const { parent: targetParent, node: targetNode, index: targetIndex } = targetLocation;

    const targetParentType = 'type' in targetParent ? (targetParent as WebsiteNode).type : 'page';
    if (!isDropAllowed(sourceNode.type, targetParentType)) {
        console.warn(`Cannot move ${sourceNode.type} into ${targetParentType}`);
        return; 
    }
    
    // 1. Remove node from its original position
    sourceParent.children.splice(sourceIndex, 1);

    // 2. Find the new index in the target parent
    // Adjust index if moving within the same parent
    const adjustedTargetIndex = sourceParent === targetParent && sourceIndex < targetIndex
        ? targetIndex - 1
        : targetIndex;

    const newIndex = position === 'before' ? adjustedTargetIndex : adjustedTargetIndex + 1;

    // 3. Insert node at the new position
    targetParent.children.splice(newIndex, 0, sourceNode);
};


// NEW: Immer-compatible function to add a node next to another node
export const addNodeNextTo = (root: WebsiteNode[], targetId: string, nodeToInsert: WebsiteNode, position: 'before' | 'after' = 'after') => {
    const targetLocation = findNodeAndParent(root, targetId);
    if (!targetLocation) {
        console.error("Target node for insertion not found.");
        return false;
    }
    
    const { parent: targetParent, index: targetIndex } = targetLocation;
    const newIndex = position === 'before' ? targetIndex : targetIndex + 1;
    targetParent.children.splice(newIndex, 0, nodeToInsert);
    return true;
};