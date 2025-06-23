import { useState, useRef, useCallback } from 'react';
import { TreeNode } from '../services/TreeDataService';

export interface DragState {
  isDragging: boolean;
  draggedNode: TreeNode | null;
  dragOverNode: TreeNode | null;
  dropPosition: 'before' | 'after' | 'inside' | null;
}

interface UseDragAndDropProps {
  onMoveNode: (draggedNode: TreeNode, targetNode: TreeNode, position: 'before' | 'after' | 'inside') => void;
  canDrop?: (draggedNode: TreeNode, targetNode: TreeNode, position: 'before' | 'after' | 'inside') => boolean;
  isEnabled?: boolean;
}

export const useDragAndDrop = ({
  onMoveNode,
  canDrop,
  isEnabled = true
}: UseDragAndDropProps) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedNode: null,
    dragOverNode: null,
    dropPosition: null
  });

  const dragCounter = useRef(0);
  const dropZoneRef = useRef<HTMLElement | null>(null);

  // Start dragging
  const handleDragStart = useCallback((node: TreeNode, event: React.DragEvent) => {
    if (!isEnabled || node.type === 'recipe') return; // Only allow dragging tags
    
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', node.id);
    
    // Create custom drag image
    const dragImage = document.createElement('div');
    dragImage.textContent = `📁 ${node.name}`;
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      background: rgba(52, 152, 219, 0.9);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    document.body.appendChild(dragImage);
    event.dataTransfer.setDragImage(dragImage, 0, 0);
    
    // Clean up drag image after a delay
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);

    setDragState(prev => ({
      ...prev,
      isDragging: true,
      draggedNode: node
    }));
  }, [isEnabled]);

  // Calculate drop position based on mouse position
  const calculateDropPosition = useCallback((event: React.DragEvent, targetElement: HTMLElement): 'before' | 'after' | 'inside' => {
    const rect = targetElement.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const height = rect.height;
    
    // Divide into three zones: top 25%, middle 50%, bottom 25%
    if (y < height * 0.25) {
      return 'before';
    } else if (y > height * 0.75) {
      return 'after';
    } else {
      return 'inside';
    }
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((node: TreeNode, event: React.DragEvent) => {
    if (!isEnabled || !dragState.isDragging || !dragState.draggedNode) return;
    
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const targetElement = event.currentTarget as HTMLElement;
    const position = calculateDropPosition(event, targetElement);
    
    // Check if drop is allowed
    const dropAllowed = canDrop ? canDrop(dragState.draggedNode, node, position) : true;
    
    if (dropAllowed) {
      setDragState(prev => ({
        ...prev,
        dragOverNode: node,
        dropPosition: position
      }));
    } else {
      event.dataTransfer.dropEffect = 'none';
    }
  }, [isEnabled, dragState.isDragging, dragState.draggedNode, calculateDropPosition, canDrop]);

  // Handle drag enter
  const handleDragEnter = useCallback((node: TreeNode, event: React.DragEvent) => {
    if (!isEnabled || !dragState.isDragging) return;
    
    event.preventDefault();
    dragCounter.current++;
  }, [isEnabled, dragState.isDragging]);

  // Handle drag leave
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    if (!isEnabled || !dragState.isDragging) return;
    
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragState(prev => ({
        ...prev,
        dragOverNode: null,
        dropPosition: null
      }));
    }
  }, [isEnabled, dragState.isDragging]);

  // Handle drop
  const handleDrop = useCallback((node: TreeNode, event: React.DragEvent) => {
    if (!isEnabled || !dragState.isDragging || !dragState.draggedNode) return;
    
    event.preventDefault();
    dragCounter.current = 0;

    const targetElement = event.currentTarget as HTMLElement;
    const position = calculateDropPosition(event, targetElement);
    
    // Prevent dropping on self or invalid targets
    if (dragState.draggedNode.id === node.id) {
      setDragState({
        isDragging: false,
        draggedNode: null,
        dragOverNode: null,
        dropPosition: null
      });
      return;
    }

    // Check if drop is allowed
    const dropAllowed = canDrop ? canDrop(dragState.draggedNode, node, position) : true;
    
    if (dropAllowed) {
      onMoveNode(dragState.draggedNode, node, position);
    }

    setDragState({
      isDragging: false,
      draggedNode: null,
      dragOverNode: null,
      dropPosition: null
    });
  }, [isEnabled, dragState, calculateDropPosition, canDrop, onMoveNode]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    dragCounter.current = 0;
    setDragState({
      isDragging: false,
      draggedNode: null,
      dragOverNode: null,
      dropPosition: null
    });
  }, []);

  // Check if node is being dragged
  const isDraggedNode = useCallback((node: TreeNode) => {
    return dragState.draggedNode?.id === node.id;
  }, [dragState.draggedNode]);

  // Check if node is drop target
  const isDropTarget = useCallback((node: TreeNode) => {
    return dragState.dragOverNode?.id === node.id;
  }, [dragState.dragOverNode]);

  // Get drop indicator position
  const getDropIndicator = useCallback((node: TreeNode) => {
    if (dragState.dragOverNode?.id === node.id) {
      return dragState.dropPosition;
    }
    return null;
  }, [dragState.dragOverNode, dragState.dropPosition]);

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    isDraggedNode,
    isDropTarget,
    getDropIndicator
  };
};