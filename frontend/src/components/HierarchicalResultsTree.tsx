import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useUnifiedData } from '../contexts/UnifiedDataContext';
import { TreeNode } from '../services/TreeDataService';
import { Recipe } from '../types';
import VirtualScrollTree from './VirtualScrollTree';

interface HierarchicalResultsTreeProps {
  query: string;
}

interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  onToggleExpansion: (nodeId: string) => void;
  onRecipeSelect?: (recipe: Recipe) => void;
  isVisible: boolean;
}

// Individual tree node component
const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({ 
  node, 
  level, 
  onToggleExpansion, 
  onRecipeSelect,
  isVisible 
}) => {
  const [isRecipeExpanded, setIsRecipeExpanded] = useState(false);
  
  if (!isVisible) {
    return null;
  }

  const handleNodeClick = () => {
    if (node.type === 'tag') {
      onToggleExpansion(node.id);
    } else if (node.type === 'recipe' && node.recipeData) {
      if (onRecipeSelect) {
        onRecipeSelect(node.recipeData);
      } else {
        setIsRecipeExpanded(!isRecipeExpanded);
      }
    }
  };

  const getNodeIcon = () => {
    if (node.type === 'tag') {
      return node.expanded ? '📂' : '📁';
    }
    return '📄';
  };

  const getNodeClass = () => {
    let className = 'tree-node';
    if (node.type === 'tag') className += ' tag-node';
    if (node.type === 'recipe') className += ' recipe-node';
    if (node.matchScore > 0) className += ' highlighted';
    return className;
  };

  const renderRecipeDetails = () => {
    if (!isRecipeExpanded || !node.recipeData) return null;
    
    const recipe = node.recipeData;
    return (
      <div className="recipe-details">
        {recipe.description && (
          <p className="recipe-description">{recipe.description}</p>
        )}
        
        <div className="recipe-meta-details">
          {recipe.prep_time && (
            <span className="meta-item">
              ⏲️ Prep: {recipe.prep_time}min
            </span>
          )}
          {recipe.cook_time && (
            <span className="meta-item">
              🔥 Cook: {recipe.cook_time}min
            </span>
          )}
          {recipe.servings && (
            <span className="meta-item">
              👥 Serves: {recipe.servings}
            </span>
          )}
        </div>

        {recipe.ingredients && (
          <div className="recipe-section">
            <h4>Ingredients:</h4>
            <div className="ingredients-list">
              {recipe.ingredients.split('\n').map((ingredient, index) => 
                ingredient.trim() && (
                  <div key={index} className="ingredient-item">
                    • {ingredient.trim()}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {recipe.instructions && (
          <div className="recipe-section">
            <h4>Instructions:</h4>
            <div className="instructions-list">
              {recipe.instructions.split('\n').map((instruction, index) => 
                instruction.trim() && (
                  <div key={index} className="instruction-item">
                    {index + 1}. {instruction.trim()}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="recipe-section">
            <h4>Tags:</h4>
            <div className="recipe-tags">
              {recipe.tags.map(tag => (
                <span key={tag.id} className="recipe-tag">
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tree-node-container">
      <div 
        className={getNodeClass()}
        style={{ paddingLeft: `${level * 1.5}rem` }}
        onClick={handleNodeClick}
      >
        <span className="node-icon">{getNodeIcon()}</span>
        <span className="node-name">{node.name}</span>
        
        {node.type === 'recipe' && node.recipeData && (
          <div className="recipe-meta">
            {node.recipeData.prep_time && node.recipeData.cook_time && (
              <span className="meta-item">
                ⏱️ {node.recipeData.prep_time + node.recipeData.cook_time}min
              </span>
            )}
            {node.recipeData.servings && (
              <span className="meta-item">
                👥 {node.recipeData.servings}
              </span>
            )}
            {node.matchScore > 0 && (
              <span className="match-score">
                {Math.round(node.matchScore * 100)}% match
              </span>
            )}
          </div>
        )}

        {node.type === 'tag' && (
          <div className="tag-meta">
            <span className="child-count">
              {node.children.filter(child => child.visible).length} items
            </span>
            <button 
              className="expand-button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpansion(node.id);
              }}
            >
              {node.expanded ? '▼' : '▶'}
            </button>
          </div>
        )}

        {node.type === 'recipe' && (
          <button 
            className="recipe-expand-button"
            onClick={(e) => {
              e.stopPropagation();
              setIsRecipeExpanded(!isRecipeExpanded);
            }}
          >
            {isRecipeExpanded ? '▲' : '▼'}
          </button>
        )}
      </div>

      {renderRecipeDetails()}

      {node.type === 'tag' && node.expanded && node.children.length > 0 && (
        <div className="tree-children">
          {node.children.map(child => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onToggleExpansion={onToggleExpansion}
              onRecipeSelect={onRecipeSelect}
              isVisible={child.visible}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const HierarchicalResultsTree: React.FC<HierarchicalResultsTreeProps> = ({ query }) => {
  const { 
    tree, 
    searchResults, 
    loading, 
    treeStats,
    toggleNodeExpansion 
  } = useUnifiedData();

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when search changes
  useEffect(() => {
    if (treeContainerRef.current) {
      treeContainerRef.current.scrollTop = 0;
    }
  }, [query, searchResults]);

  // Determine if virtual scrolling should be used (for large datasets)
  useEffect(() => {
    const totalNodes = tree.filter(node => node.visible).length;
    setUseVirtualScrolling(totalNodes > 50); // Enable virtual scrolling for 50+ items
  }, [tree]);

  if (loading) {
    return (
      <div className="hierarchical-tree-loading">
        <div className="loading-spinner">🔍</div>
        <p>Searching recipes...</p>
      </div>
    );
  }

  if (query && searchResults.length === 0) {
    return (
      <div className="no-results">
        <div className="no-results-icon">🔍</div>
        <h3>No recipes found</h3>
        <p>Try searching for:</p>
        <ul>
          <li>Different ingredients (chicken, pasta, beef)</li>
          <li>Recipe categories (dessert, soup, salad)</li>
          <li>Cooking methods (baked, grilled, fried)</li>
          <li>Cuisine types (italian, mexican, asian)</li>
        </ul>
      </div>
    );
  }

  const visibleNodes = tree.filter(node => node.visible);

  // Render function for virtual scrolling
  const renderVirtualNode = useCallback((node: TreeNode, level: number, index: number) => {
    return (
      <TreeNodeComponent
        key={node.id}
        node={node}
        level={level}
        onToggleExpansion={toggleNodeExpansion}
        onRecipeSelect={setSelectedRecipe}
        isVisible={node.visible}
      />
    );
  }, [toggleNodeExpansion]);

  return (
    <div className="hierarchical-results-tree">
      <div className="tree-header">
        <h2>
          {query ? `Search Results for "${query}"` : 'Browse All Recipes'}
        </h2>
        <div className="result-stats">
          {treeStats.recipeNodes} recipes • {treeStats.tagNodes} categories
          {query && searchResults.length > 0 && (
            <span className="search-matches">
              • {searchResults.length} matches
            </span>
          )}
        </div>
      </div>

      <div className="tree-controls">
        <button 
          className="control-button"
          onClick={() => {
            // Expand all visible tag nodes
            visibleNodes.forEach(node => {
              if (node.type === 'tag' && !node.expanded) {
                toggleNodeExpansion(node.id);
              }
            });
          }}
        >
          📂 Expand All
        </button>
        
        <button 
          className="control-button"
          onClick={() => {
            // Collapse all expanded tag nodes
            visibleNodes.forEach(node => {
              if (node.type === 'tag' && node.expanded) {
                toggleNodeExpansion(node.id);
              }
            });
          }}
        >
          📁 Collapse All
        </button>

        {query && (
          <div className="search-summary">
            Showing results matching "{query}"
          </div>
        )}

        {useVirtualScrolling && (
          <div className="virtual-scroll-indicator">
            ⚡ Virtual scrolling enabled for optimal performance
          </div>
        )}
      </div>

      <div 
        ref={treeContainerRef}
        className="tree-container"
      >
        {visibleNodes.length === 0 ? (
          <div className="empty-tree">
            <div className="empty-icon">🌳</div>
            <p>No items to display</p>
          </div>
        ) : useVirtualScrolling ? (
          <VirtualScrollTree
            nodes={visibleNodes}
            itemHeight={60} // Approximate height of each tree node
            containerHeight={600} // Max height of tree container
            onToggleExpansion={toggleNodeExpansion}
            renderNode={renderVirtualNode}
            overscan={10}
          />
        ) : (
          <div className="tree-content">
            {visibleNodes.map(node => (
              <TreeNodeComponent
                key={node.id}
                node={node}
                level={0}
                onToggleExpansion={toggleNodeExpansion}
                onRecipeSelect={setSelectedRecipe}
                isVisible={node.visible}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recipe detail modal */}
      {selectedRecipe && (
        <div className="recipe-modal-overlay" onClick={() => setSelectedRecipe(null)}>
          <div className="recipe-modal" onClick={(e) => e.stopPropagation()}>
            <div className="recipe-modal-header">
              <h2>{selectedRecipe.title}</h2>
              <button 
                className="close-modal"
                onClick={() => setSelectedRecipe(null)}
              >
                ✕
              </button>
            </div>
            <div className="recipe-modal-content">
              {/* Recipe content would go here - simplified for now */}
              <p>Recipe details would be shown here</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .hierarchical-results-tree {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
        }

        .hierarchical-tree-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
          color: #666;
        }

        .loading-spinner {
          font-size: 3rem;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }

        .no-results {
          text-align: center;
          padding: 3rem 2rem;
          color: #666;
        }

        .no-results-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .no-results h3 {
          color: #333;
          margin-bottom: 1rem;
        }

        .no-results ul {
          text-align: left;
          max-width: 300px;
          margin: 1rem auto;
        }

        .no-results li {
          margin-bottom: 0.5rem;
        }

        .tree-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding: 0 1rem;
        }

        .tree-header h2 {
          color: #2c3e50;
          margin: 0;
          font-size: 1.5rem;
        }

        .result-stats {
          color: #666;
          font-size: 0.9rem;
          background: rgba(52, 152, 219, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 15px;
          border: 1px solid rgba(52, 152, 219, 0.2);
        }

        .search-matches {
          color: #27ae60;
          font-weight: 500;
        }

        .tree-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 0 1rem;
        }

        .control-button {
          background: rgba(52, 152, 219, 0.1);
          border: 1px solid rgba(52, 152, 219, 0.2);
          color: #3498db;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .control-button:hover {
          background: rgba(52, 152, 219, 0.2);
          border-color: rgba(52, 152, 219, 0.3);
        }

        .search-summary {
          color: #666;
          font-style: italic;
          margin-left: auto;
        }

        .virtual-scroll-indicator {
          background: rgba(156, 39, 176, 0.1);
          border: 1px solid rgba(156, 39, 176, 0.2);
          color: #9c27b0;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .tree-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          max-height: 600px;
          overflow-y: auto;
        }

        .tree-content {
          padding: 1rem;
        }

        .empty-tree {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #999;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .tree-node-container {
          margin-bottom: 0.25rem;
        }

        .tree-node {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .tree-node:hover {
          background: #f8f9fa;
        }

        .tree-node.highlighted {
          background: rgba(255, 235, 59, 0.2);
          border-left: 3px solid #ffc107;
        }

        .node-icon {
          font-size: 1.2rem;
          margin-right: 0.75rem;
          flex-shrink: 0;
        }

        .node-name {
          flex: 1;
          font-weight: 500;
          color: #333;
          margin-right: 0.75rem;
        }

        .tag-node .node-name {
          color: #2c3e50;
          font-weight: 600;
        }

        .recipe-node .node-name {
          color: #27ae60;
        }

        .recipe-meta, .tag-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #666;
        }

        .meta-item {
          background: rgba(108, 117, 125, 0.1);
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          white-space: nowrap;
        }

        .match-score {
          background: rgba(255, 193, 7, 0.2);
          color: #856404;
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-weight: 500;
        }

        .child-count {
          background: rgba(52, 152, 219, 0.1);
          color: #3498db;
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
        }

        .expand-button, .recipe-expand-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s ease;
          font-size: 0.8rem;
        }

        .expand-button:hover, .recipe-expand-button:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #333;
        }

        .tree-children {
          border-left: 2px solid #e9ecef;
          margin-left: 1rem;
          padding-left: 0;
        }

        .recipe-details {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          margin: 0.5rem 0 0 2.5rem;
          border-left: 3px solid #27ae60;
        }

        .recipe-description {
          color: #555;
          font-style: italic;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .recipe-meta-details {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .recipe-section {
          margin-bottom: 1rem;
        }

        .recipe-section h4 {
          color: #2c3e50;
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .ingredients-list, .instructions-list {
          font-size: 0.85rem;
          line-height: 1.5;
        }

        .ingredient-item, .instruction-item {
          margin-bottom: 0.25rem;
          color: #555;
        }

        .recipe-tags {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .recipe-tag {
          background: rgba(52, 152, 219, 0.1);
          color: #3498db;
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .recipe-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .recipe-modal {
          background: white;
          border-radius: 12px;
          max-width: 600px;
          max-height: 80vh;
          width: 90%;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .recipe-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e9ecef;
        }

        .recipe-modal-header h2 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.5rem;
        }

        .close-modal {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .close-modal:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #333;
        }

        .recipe-modal-content {
          padding: 1.5rem;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .tree-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .tree-controls {
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .search-summary {
            margin-left: 0;
            margin-top: 0.5rem;
          }

          .tree-container {
            max-height: 500px;
          }

          .tree-node {
            padding: 0.6rem;
          }

          .recipe-details {
            margin-left: 1rem;
            padding: 0.75rem;
          }

          .recipe-meta-details {
            gap: 0.5rem;
          }

          .recipe-modal {
            width: 95%;
            max-height: 90vh;
          }

          .recipe-modal-header {
            padding: 1rem;
          }

          .recipe-modal-content {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .tree-header h2 {
            font-size: 1.25rem;
          }

          .result-stats {
            font-size: 0.8rem;
            padding: 0.4rem 0.8rem;
          }

          .tree-children {
            margin-left: 0.5rem;
          }

          .recipe-details {
            margin-left: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default HierarchicalResultsTree;