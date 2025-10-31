
import { v4 as uuidv4 } from 'uuid';
import type { WebsiteNode, Section, Row, Column, Element, ResponsiveStyles } from '../types';

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

// Immer-compatible function to update a node
export function updateNodeById(nodes: WebsiteNode[], id: string, updates: Partial<WebsiteNode>): boolean {
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.id === id) {
            // FIX: Refactored the update logic to prevent incorrect type compositions.
            // Apply shallow updates first.
            const updatedNode = { ...node, ...updates };

            // Then, handle deep merges for nested properties if they were part of the updates.
            // This prevents the shallow spread from overwriting nested objects incorrectly.
            // FIX: Added a type guard `'content' in updates` to ensure `updates.content` can be safely accessed.
            if ('content' in updates && updates.content && 'content' in node && node.content) {
                (updatedNode as any).content = { ...node.content, ...updates.content };
            }

            if (updates.styles) {
                updatedNode.styles = {
                    desktop: { ...node.styles.desktop, ...updates.styles.desktop },
                    tablet: { ...node.styles.tablet, ...updates.styles.tablet },
                    mobile: { ...node.styles.mobile, ...updates.styles.mobile },
                };
            }

            nodes[i] = updatedNode as WebsiteNode;
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


const createDefaultElement = (type: Element['type']): Element => {
    const base = { id: uuidv4(), styles: createDefaultStyles() };
    switch(type) {
        case 'headline': return { ...base, type: 'headline', content: { level: 'h2', text: 'New Headline' } };
        case 'text': return { ...base, type: 'text', content: { text: 'New paragraph of text. Click here to edit.' } };
        case 'image': return { ...base, type: 'image', content: { src: 'https://images.unsplash.com/photo-1554629947-334ff61d85dc?q=80&w=2072&auto=format&fit=crop', alt: 'Mountain landscape' } };
        case 'button': return { ...base, type: 'button', content: { text: 'Click Me', href: '#' } };
        case 'spacer': return { ...base, type: 'spacer', content: {}, styles: { desktop: { height: '2rem'}, tablet: {}, mobile: {} }};
        case 'icon': return { ...base, type: 'icon', content: { name: 'star' } };
        case 'video': return { ...base, type: 'video', content: { src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } };
        case 'form': return { ...base, type: 'form', content: { buttonText: 'Submit' } };
        case 'embed': return { ...base, type: 'embed', content: { html: '<p class="p-4 bg-slate-100 rounded text-center">Your embedded content will show here.</p>' } };
    }
}


// Immer-compatible function to add a new node
// FIX: Widen type to include 'section' to match implementation and fix comparison error.
export const addNode = (draft: { children: Section[], id: string }, parentId: string, type: 'section' | 'row' | 'column' | Element['type']) => {
    // Handle adding a section to the root
    if (parentId === draft.id && type === 'section') {
        const newSection: Section = { id: uuidv4(), type: 'section', styles: createDefaultStyles(), children: [] };
        draft.children.push(newSection);
        return;
    }
    
    const parent = findNodeById(draft.children, parentId);
    if (!parent || !('children' in parent) || !Array.isArray(parent.children)) return;

    // FIX: Add check for 'section' to narrow the `type` variable for the switch statement below.
    // Sections can only be added to the root, which is handled above.
    if (type === 'section') {
        return;
    }
    
    let newNode: Row | Column | Element;

    switch (type) {
        case 'row':
            newNode = { id: uuidv4(), type: 'row', styles: createDefaultStyles(), children: [] };
            (parent as Section).children.push(newNode);
            break;
        case 'column':
            newNode = { id: uuidv4(), type: 'column', styles: createDefaultStyles(), children: [] };
             (parent as Row).children.push(newNode);
            break;
        default: // Element types
             newNode = createDefaultElement(type);
             (parent as Column).children.push(newNode);
             break;
    }
};

// --- Drag and Drop Logic ---

interface NodeLocation {
  parent: (WebsiteNode & { children: WebsiteNode[] }) | { children: WebsiteNode[] };
  node: WebsiteNode;
  index: number;
}
// Finds a node and its parent container. The root is represented as a simple object with a `children` property.
const findNodeAndParent = (root: WebsiteNode[], id: string): NodeLocation | null => {
    for (let i = 0; i < root.length; i++) {
        const node = root[i];
        if (node.id === id) {
            return { parent: { children: root }, node, index: i };
        }
        if ('children' in node && Array.isArray(node.children)) {
            const found = findNodeAndParent(node.children as WebsiteNode[], id);
            if (found) return found;
        }
    }
    return null;
}

// Defines what node types can be dropped into which parent types.
const validChildrenMap: Record<string, string[]> = {
    root: ['section'],
    section: ['row'],
    row: ['column'],
    column: ['headline', 'text', 'image', 'button', 'spacer', 'icon', 'video', 'form', 'embed'],
};

export const moveNode = (root: WebsiteNode[], sourceId: string, targetId: string, position: 'before' | 'after') => {
    if (sourceId === targetId) return;

    const sourceLocation = findNodeAndParent(root, sourceId);
    const targetLocation = findNodeAndParent(root, targetId);

    if (!sourceLocation || !targetLocation) return;
    
    const { parent: sourceParent, node: sourceNode, index: sourceIndex } = sourceLocation;
    const { parent: targetParent, node: targetNode, index: targetIndex } = targetLocation;

    // Validation: Check if the source node type is allowed in the target's parent
    const targetParentType = 'type' in targetParent ? targetParent.type : 'root';
    if (!validChildrenMap[targetParentType]?.includes(sourceNode.type)) {
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
