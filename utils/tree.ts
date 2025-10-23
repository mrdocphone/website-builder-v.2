import type { WebsiteData, WebsiteNode } from '../types';

// Type guard to check if a node has children. This includes WebsiteData.
function hasChildren(node: any): node is { children: WebsiteNode[] } {
    return node && Array.isArray(node.children);
}

/**
 * Recursively finds a node within the website data structure by its ID.
 * @param root The root of the tree or subtree to search (WebsiteData or any WebsiteNode).
 * @param nodeId The ID of the node to find.
 * @returns The found WebsiteNode, or null if not found.
 */
export const findNode = (root: WebsiteData | WebsiteNode, nodeId: string): WebsiteNode | null => {
  // The root WebsiteData object doesn't have an ID, but WebsiteNode does.
  if ('id' in root && root.id === nodeId) {
    return root;
  }

  if (hasChildren(root)) {
    for (const child of root.children) {
      const found = findNode(child as WebsiteNode, nodeId);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

/**
 * Recursively finds the parent of a node within the website data structure by the child's ID.
 * @param root The root of the tree or subtree to search.
 * @param nodeId The ID of the child node whose parent is to be found.
 * @returns The parent node (which could be WebsiteData or a WebsiteNode), or null if not found.
 */
export const findParentNode = (
  root: WebsiteData | WebsiteNode,
  nodeId: string
): WebsiteData | WebsiteNode | null => {
  if (hasChildren(root)) {
    for (const child of root.children) {
      const node = child as WebsiteNode;
      if (node.id === nodeId) {
        return root;
      }
      const foundParent = findParentNode(node, nodeId);
      if (foundParent) {
        return foundParent;
      }
    }
  }
  return null;
};
