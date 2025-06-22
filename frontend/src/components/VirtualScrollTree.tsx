import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TreeNode } from '../services/TreeDataService';

interface VirtualScrollTreeProps {
  nodes: TreeNode[];
  itemHeight: number;
  containerHeight: number;
  onToggleExpansion: (nodeId: string) => void;
  renderNode: (node: TreeNode, level: number, index: number) => React.ReactNode;
  overscan?: number;
}

interface FlatNode {
  node: TreeNode;
  level: number;
  index: number;
}

const VirtualScrollTree: React.FC<VirtualScrollTreeProps> = ({
  nodes,
  itemHeight,
  containerHeight,
  onToggleExpansion,
  renderNode,
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten the tree into a linear array for virtual scrolling
  const flattenedNodes = useMemo(() => {
    const flattened: FlatNode[] = [];
    
    const flatten = (nodes: TreeNode[], level: number = 0) => {
      nodes.forEach((node, index) => {
        if (node.visible) {
          flattened.push({ node, level, index: flattened.length });
          
          // If node is expanded and has children, flatten them recursively
          if (node.type === 'tag' && node.expanded && node.children.length > 0) {
            flatten(node.children.filter(child => child.visible), level + 1);
          }
        }
      });
    };
    
    flatten(nodes);
    return flattened;
  }, [nodes]);

  // Calculate which items are visible
  const visibleRange = useMemo(() => {
    const totalItems = flattenedNodes.length;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount + overscan, totalItems);
    
    return {
      start: Math.max(0, startIndex - overscan),
      end: endIndex,
      total: totalItems
    };
  }, [flattenedNodes.length, containerHeight, itemHeight, scrollTop, overscan]);

  // Calculate total height for scrollbar
  const totalHeight = flattenedNodes.length * itemHeight;

  // Handle scroll events
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Get visible items
  const visibleItems = flattenedNodes.slice(visibleRange.start, visibleRange.end);

  // Calculate offset for visible items
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        overflow: 'auto'
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item) => (
            <div
              key={`${item.node.id}-${item.level}`}
              style={{
                height: itemHeight,
                overflow: 'hidden'
              }}
            >
              {renderNode(item.node, item.level, item.index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualScrollTree;