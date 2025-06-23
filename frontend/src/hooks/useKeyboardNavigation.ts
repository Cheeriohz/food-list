import { useEffect, useCallback, useState } from 'react';
import { TreeNode } from '../services/TreeDataService';

interface KeyboardNavigationProps {
  nodes: TreeNode[];
  onToggleExpansion: (nodeId: string) => void;
  onSelectNode?: (node: TreeNode) => void;
  isEnabled?: boolean;
}

interface NavigationState {
  focusedIndex: number;
  focusedNodeId: string | null;
}

export const useKeyboardNavigation = ({
  nodes,
  onToggleExpansion,
  onSelectNode,
  isEnabled = true
}: KeyboardNavigationProps) => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    focusedIndex: -1,
    focusedNodeId: null
  });

  // Flatten visible nodes for navigation
  const flattenVisibleNodes = useCallback((nodes: TreeNode[]): TreeNode[] => {
    const flattened: TreeNode[] = [];
    
    const flatten = (nodeList: TreeNode[]) => {
      nodeList.forEach(node => {
        if (node.visible) {
          flattened.push(node);
          if (node.type === 'tag' && node.expanded && node.children.length > 0) {
            flatten(node.children.filter(child => child.visible));
          }
        }
      });
    };
    
    flatten(nodes);
    return flattened;
  }, []);

  const visibleNodes = flattenVisibleNodes(nodes);

  // Navigate to next/previous node
  const navigateToIndex = useCallback((newIndex: number) => {
    if (newIndex >= 0 && newIndex < visibleNodes.length) {
      const node = visibleNodes[newIndex];
      setNavigationState({
        focusedIndex: newIndex,
        focusedNodeId: node.id
      });
      
      // Scroll focused element into view
      const element = document.querySelector(`[data-node-id="${node.id}"]`);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }
    }
  }, [visibleNodes]);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled || visibleNodes.length === 0) return;

    const { focusedIndex } = navigationState;
    const focusedNode = focusedIndex >= 0 ? visibleNodes[focusedIndex] : null;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        navigateToIndex(Math.min(focusedIndex + 1, visibleNodes.length - 1));
        break;

      case 'ArrowUp':
        event.preventDefault();
        navigateToIndex(Math.max(focusedIndex - 1, 0));
        break;

      case 'ArrowRight':
        event.preventDefault();
        if (focusedNode?.type === 'tag' && !focusedNode.expanded) {
          onToggleExpansion(focusedNode.id);
        }
        break;

      case 'ArrowLeft':
        event.preventDefault();
        if (focusedNode?.type === 'tag' && focusedNode.expanded) {
          onToggleExpansion(focusedNode.id);
        }
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedNode) {
          if (focusedNode.type === 'tag') {
            onToggleExpansion(focusedNode.id);
          } else if (onSelectNode) {
            onSelectNode(focusedNode);
          }
        }
        break;

      case 'Home':
        event.preventDefault();
        navigateToIndex(0);
        break;

      case 'End':
        event.preventDefault();
        navigateToIndex(visibleNodes.length - 1);
        break;

      case 'PageDown':
        event.preventDefault();
        navigateToIndex(Math.min(focusedIndex + 10, visibleNodes.length - 1));
        break;

      case 'PageUp':
        event.preventDefault();
        navigateToIndex(Math.max(focusedIndex - 10, 0));
        break;

      default:
        // Handle letter navigation (jump to next node starting with letter)
        if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
          event.preventDefault();
          const letter = event.key.toLowerCase();
          const startIndex = focusedIndex + 1;
          
          // Find next node starting with this letter
          for (let i = 0; i < visibleNodes.length; i++) {
            const index = (startIndex + i) % visibleNodes.length;
            const node = visibleNodes[index];
            if (node.name.toLowerCase().startsWith(letter)) {
              navigateToIndex(index);
              break;
            }
          }
        }
        break;
    }
  }, [
    isEnabled,
    visibleNodes,
    navigationState,
    navigateToIndex,
    onToggleExpansion,
    onSelectNode
  ]);

  // Set up keyboard event listeners
  useEffect(() => {
    if (isEnabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEnabled, handleKeyDown]);

  // Reset navigation when nodes change
  useEffect(() => {
    if (navigationState.focusedIndex >= visibleNodes.length) {
      setNavigationState({
        focusedIndex: -1,
        focusedNodeId: null
      });
    }
  }, [visibleNodes.length, navigationState.focusedIndex]);

  // Initialize focus on first node if none focused
  const initializeFocus = useCallback(() => {
    if (visibleNodes.length > 0 && navigationState.focusedIndex === -1) {
      navigateToIndex(0);
    }
  }, [visibleNodes.length, navigationState.focusedIndex, navigateToIndex]);

  return {
    focusedNodeId: navigationState.focusedNodeId,
    focusedIndex: navigationState.focusedIndex,
    initializeFocus,
    navigateToIndex,
    visibleNodes
  };
};