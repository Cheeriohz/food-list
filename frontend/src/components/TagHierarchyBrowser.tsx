import React, { useState } from 'react';
import { Tag } from '../types';

interface TagHierarchyBrowserProps {
  tags: Tag[];
  selectedTagNames?: string[];
  onTagSelect?: (tag: Tag) => void;
  onTagToggle?: (tagName: string) => void;
  searchQuery?: string;
  selectionMode?: 'single' | 'multiple' | 'none';
  showExpandableControls?: boolean;
  title?: string;
  className?: string;
}

interface TagNodeProps {
  tag: Tag;
  selectedTagNames: string[];
  onTagSelect?: (tag: Tag) => void;
  onTagToggle?: (tagName: string) => void;
  selectionMode: 'single' | 'multiple' | 'none';
  searchQuery: string;
  expandedNodes: Set<string>;
  onToggleExpanded: (tagName: string) => void;
  showExpandableControls: boolean;
  level?: number;
}

const TagNode: React.FC<TagNodeProps> = ({
  tag,
  selectedTagNames,
  onTagSelect,
  onTagToggle,
  selectionMode,
  searchQuery,
  expandedNodes,
  onToggleExpanded,
  showExpandableControls,
  level = 0
}) => {
  const isSelected = selectedTagNames.includes(tag.name);
  const hasChildren = tag.children && tag.children.length > 0;
  const isExpanded = expandedNodes.has(tag.name);
  const isFiltered = searchQuery && !tag.name.toLowerCase().includes(searchQuery.toLowerCase());

  // If searching, show all matching nodes and their children
  const shouldShow = !searchQuery || 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (hasChildren && tag.children?.some(child => 
      child.name.toLowerCase().includes(searchQuery.toLowerCase())
    ));

  if (!shouldShow) return null;

  const handleClick = () => {
    if (selectionMode === 'single' && onTagSelect) {
      onTagSelect(tag);
    } else if (selectionMode === 'multiple' && onTagToggle) {
      onTagToggle(tag.name);
    }
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpanded(tag.name);
  };

  const indent = level * 16;

  return (
    <li style={{ listStyle: 'none' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.25rem 0.5rem',
          marginLeft: `${indent}px`,
          cursor: selectionMode !== 'none' ? 'pointer' : 'default',
          backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
          borderRadius: '4px',
          fontSize: '0.875rem'
        }}
        onClick={handleClick}
      >
        {hasChildren && showExpandableControls && (
          <button
            onClick={handleExpandClick}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              marginRight: '0.5rem',
              padding: 0,
              fontSize: '0.75rem',
              color: '#666',
              width: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        
        {!hasChildren && showExpandableControls && (
          <div style={{ width: '12px', marginRight: '0.5rem' }} />
        )}
        
        <span
          style={{
            color: level === 0 ? '#2c3e50' : '#34495e',
            fontWeight: level === 0 ? 'bold' : 'normal'
          }}
        >
          {tag.name}
        </span>
      </div>
      
      {hasChildren && (isExpanded || searchQuery) && (
        <ul style={{ margin: 0, padding: 0 }}>
          {tag.children!.map(child => (
            <TagNode
              key={child.id}
              tag={child}
              selectedTagNames={selectedTagNames}
              onTagSelect={onTagSelect}
              onTagToggle={onTagToggle}
              selectionMode={selectionMode}
              searchQuery={searchQuery}
              expandedNodes={expandedNodes}
              onToggleExpanded={onToggleExpanded}
              showExpandableControls={showExpandableControls}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const TagHierarchyBrowser: React.FC<TagHierarchyBrowserProps> = ({
  tags,
  selectedTagNames = [],
  onTagSelect,
  onTagToggle,
  searchQuery = '',
  selectionMode = 'multiple',
  showExpandableControls = true,
  title,
  className = ''
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(tags.map(tag => tag.name)) // Root nodes expanded by default
  );

  const handleToggleExpanded = (tagName: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagName)) {
        newSet.delete(tagName);
      } else {
        newSet.add(tagName);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const getAllTagNames = (tagList: Tag[]): string[] => {
      let names: string[] = [];
      const traverse = (tags: Tag[]) => {
        for (const tag of tags) {
          names.push(tag.name);
          if (tag.children) {
            traverse(tag.children);
          }
        }
      };
      traverse(tagList);
      return names;
    };
    
    setExpandedNodes(new Set(getAllTagNames(tags)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  return (
    <div className={`tag-hierarchy-browser ${className}`}>
      {title && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          {showExpandableControls && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={expandAll}
                style={{
                  background: 'none',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                style={{
                  background: 'none',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                Collapse All
              </button>
            </div>
          )}
        </div>
      )}
      
      <ul style={{ margin: 0, padding: 0 }}>
        {tags.map(tag => (
          <TagNode
            key={tag.id}
            tag={tag}
            selectedTagNames={selectedTagNames}
            onTagSelect={onTagSelect}
            onTagToggle={onTagToggle}
            selectionMode={selectionMode}
            searchQuery={searchQuery}
            expandedNodes={expandedNodes}
            onToggleExpanded={handleToggleExpanded}
            showExpandableControls={showExpandableControls}
          />
        ))}
      </ul>
      
      {tags.length === 0 && (
        <div style={{
          padding: '1rem',
          textAlign: 'center',
          color: '#999',
          fontStyle: 'italic'
        }}>
          No tags found
        </div>
      )}
    </div>
  );
};

export default TagHierarchyBrowser;