
import { v4 as uuidv4 } from 'uuid';
import type { WebsiteNode, Section, Row, Column, Element } from '../types';
import { produce } from 'immer';

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
            // FIX: The original implementation overwrote the `content` object, losing properties.
            // This new implementation correctly merges the `content` and `styles` objects.
            const updatedNode = { ...node, ...updates };

            if (updates.styles) {
                updatedNode.styles = { ...node.styles, ...updates.styles };
            }

            if (updates.content && 'content' in node && node.content) {
                (updatedNode as any).content = { ...node.content, ...updates.content };
            }
            
            // A type assertion is used here because TypeScript cannot verify that the merged
            // object correctly conforms to the complex WebsiteNode discriminated union.
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

// FIX: Corrected the function to properly create discriminated union types.
// The `type` property was removed from the `base` object and added to each `case`'s
// return object, allowing TypeScript to correctly narrow and validate the type.
const createDefaultElement = (type: Element['type']): Element => {
    const base = { id: uuidv4(), styles: {} };
    switch(type) {
        case 'headline': return { ...base, type: 'headline', content: { level: 'h2', text: 'New Headline' } };
        case 'text': return { ...base, type: 'text', content: { text: 'New paragraph of text. Click here to edit.' } };
        case 'image': return { ...base, type: 'image', content: { src: 'https://images.unsplash.com/photo-1554629947-334ff61d85dc?q=80&w=2072&auto=format&fit=crop', alt: 'Mountain landscape' } };
        case 'button': return { ...base, type: 'button', content: { text: 'Click Me', href: '#' } };
    }
}


// Immer-compatible function to add a new node
export const addNode = (draft: { children: Section[] }, parentId: string, type: 'row' | 'column' | Element['type']) => {
    const parent = findNodeById(draft.children, parentId);
    if (!parent || !('children' in parent) || !Array.isArray(parent.children)) return;

    let newNode: Row | Column | Element;

    switch (type) {
        case 'row':
            newNode = { id: uuidv4(), type: 'row', styles: {}, children: [] };
            (parent as Section).children.push(newNode);
            break;
        case 'column':
            newNode = { id: uuidv4(), type: 'column', styles: {}, children: [] };
             (parent as Row).children.push(newNode);
            break;
        default: // Element types
             newNode = createDefaultElement(type);
             (parent as Column).children.push(newNode);
             break;
    }
};
