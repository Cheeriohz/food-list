import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useUnifiedData } from '../contexts/UnifiedDataContext';
import { TreeNode } from '../services/TreeDataService';
import TreeDataService from '../services/TreeDataService';
import SearchIndexService from '../services/SearchIndexService';
import { Recipe, Tag } from '../types';
import VirtualScrollTree from './VirtualScrollTree';
import { useKeyboardNavigation } from '../hooks/useKeyboardNavigation';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import RecipeComparison from './RecipeComparison';
import { SearchFilters } from './AdvancedSearchFilters';

interface HierarchicalResultsTreeProps {
  query: string;
  filters?: SearchFilters;
}

interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  onToggleExpansion: (nodeId: string) => void;
  onRecipeSelect?: (recipe: Recipe) => void;
  isVisible: boolean;
  isFocused?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  dropIndicator?: 'before' | 'after' | 'inside' | null;
  onDragStart?: (node: TreeNode, event: React.DragEvent) => void;
  onDragOver?: (node: TreeNode, event: React.DragEvent) => void;
  onDragEnter?: (node: TreeNode, event: React.DragEvent) => void;
  onDragLeave?: (event: React.DragEvent) => void;
  onDrop?: (node: TreeNode, event: React.DragEvent) => void;
  onDragEnd?: () => void;
  isComparisonMode?: boolean;
  onAddToComparison?: (recipe: Recipe) => void;
  isInComparison?: boolean;
}

// Individual tree node component
const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({ 
  node, 
  level, 
  onToggleExpansion, 
  onRecipeSelect,
  isVisible,
  isFocused = false,
  isDragging = false,
  isDropTarget = false,
  dropIndicator = null,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
  isComparisonMode = false,
  onAddToComparison,
  isInComparison = false
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
    if (isFocused) className += ' focused';
    if (isDragging) className += ' dragging';
    if (isDropTarget) className += ' drop-target';
    if (dropIndicator) className += ` drop-${dropIndicator}`;
    if (isComparisonMode) className += ' comparison-mode';
    if (isInComparison) className += ' in-comparison';
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
      {dropIndicator === 'before' && (
        <div className="drop-indicator drop-before">
          <div className="drop-line"></div>
        </div>
      )}
      
      <div 
        className={getNodeClass()}
        style={{ paddingLeft: `${level * 1.5}rem` }}
        onClick={handleNodeClick}
        data-node-id={node.id}
        tabIndex={isFocused ? 0 : -1}
        draggable={node.type === 'tag'}
        onDragStart={(e) => onDragStart?.(node, e)}
        onDragOver={(e) => onDragOver?.(node, e)}
        onDragEnter={(e) => onDragEnter?.(node, e)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop?.(node, e)}
        onDragEnd={onDragEnd}
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
          <div className="recipe-actions">
            {isComparisonMode && (
              <button
                className={`compare-button ${isInComparison ? 'in-comparison' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (node.recipeData && onAddToComparison) {
                    onAddToComparison(node.recipeData);
                  }
                }}
                title={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
              >
                {isInComparison ? '✓' : '+'}
              </button>
            )}
            <button 
              className="recipe-expand-button"
              onClick={(e) => {
                e.stopPropagation();
                setIsRecipeExpanded(!isRecipeExpanded);
              }}
            >
              {isRecipeExpanded ? '▲' : '▼'}
            </button>
          </div>
        )}
      </div>

      {dropIndicator === 'after' && (
        <div className="drop-indicator drop-after">
          <div className="drop-line"></div>
        </div>
      )}

      {dropIndicator === 'inside' && (
        <div className="drop-indicator drop-inside">
          <div className="drop-highlight">Drop inside to make child</div>
        </div>
      )}

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
              isFocused={false}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              isComparisonMode={isComparisonMode}
              onAddToComparison={onAddToComparison}
              isInComparison={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const HierarchicalResultsTree: React.FC<HierarchicalResultsTreeProps> = ({ query, filters }) => {
  const { 
    tree, 
    searchResults, 
    loading, 
    treeStats,
    toggleNodeExpansion 
  } = useUnifiedData();

  // BYPASS: Direct data loading to fix broken UnifiedDataProvider
  const [bypassTree, setBypassTree] = useState<TreeNode[]>([]);
  const [bypassLoading, setBypassLoading] = useState(false);
  const [bypassInitialized, setBypassInitialized] = useState(false);

  useEffect(() => {
    if (!bypassInitialized) {
      console.log('🔧 BYPASS: Starting direct data loading...');
      setBypassLoading(true);
      
      const loadDataDirectly = async () => {
        try {
          console.log('🔧 BYPASS: Fetching recipes and tags...');
          const [recipesResponse, tagsResponse] = await Promise.all([
            fetch('/api/recipes'),
            fetch('/api/tags')
          ]);
          
          if (!recipesResponse.ok || !tagsResponse.ok) {
            throw new Error('Failed to fetch data');
          }
          
          const recipes: Recipe[] = await recipesResponse.json();
          const tags: Tag[] = await tagsResponse.json();
          
          console.log('🔧 BYPASS: Data loaded - Recipes:', recipes.length, 'Tags:', tags.length);
          console.log('🔧 BYPASS: Sample recipe:', recipes[0]);
          
          // Initialize TreeDataService directly
          const treeService = new TreeDataService();
          console.log('🔧 BYPASS: Initializing TreeDataService...');
          treeService.initialize(recipes, tags);
          
          // Build tree
          const tree = treeService.buildTree({ showEmptyTags: true });
          console.log('🔧 BYPASS: Tree built with', tree.length, 'root nodes');
          
          // Get tree stats
          const stats = treeService.getTreeStatistics(tree);
          console.log('🔧 BYPASS: Tree stats:', stats);
          
          setBypassTree(tree);
          setBypassInitialized(true);
          console.log('🔧 BYPASS: ✅ Direct data loading completed!');
          
        } catch (error) {
          console.error('🔧 BYPASS: ❌ Error in direct data loading:', error);
        } finally {
          setBypassLoading(false);
        }
      };
      
      loadDataDirectly();
    }
  }, [bypassInitialized]);

  // Use bypass data if available, otherwise fall back to context data
  const activeTree = bypassTree.length > 0 ? bypassTree : tree;
  const activeLoading = bypassLoading || loading;

  // Debug logging
  console.log('🔴 Tree render - Query:', query, 'Nodes:', activeTree.length, 'Results:', searchResults.length);
  console.log('🔴 Using bypass tree:', bypassTree.length > 0, 'Bypass initialized:', bypassInitialized);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);
  const [keyboardNavigationEnabled, setKeyboardNavigationEnabled] = useState(true);
  const [dragDropEnabled, setDragDropEnabled] = useState(true);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonRecipes, setComparisonRecipes] = useState<Recipe[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  // Apply filters and sorting to visible nodes
  const applyFiltersAndSorting = useCallback((nodes: TreeNode[]): TreeNode[] => {
    if (!filters) return nodes.filter(node => node.visible);

    let filteredNodes = nodes.filter(node => {
      if (!node.visible) return false;
      
      // Only apply filters to recipe nodes
      if (node.type === 'recipe' && node.recipeData) {
        const recipe = node.recipeData;
        
        // Tag filters
        if (filters.tags.length > 0) {
          const recipeTags = recipe.tags?.map(tag => tag.name) || [];
          const hasMatchingTag = filters.tags.some(filterTag => 
            recipeTags.includes(filterTag)
          );
          if (!hasMatchingTag) return false;
        }
        
        // Time filters
        if (recipe.prep_time !== undefined) {
          if (recipe.prep_time < filters.prepTimeRange[0] || 
              recipe.prep_time > filters.prepTimeRange[1]) {
            return false;
          }
        }
        
        if (recipe.cook_time !== undefined) {
          if (recipe.cook_time < filters.cookTimeRange[0] || 
              recipe.cook_time > filters.cookTimeRange[1]) {
            return false;
          }
        }
        
        // Servings filter
        if (recipe.servings !== undefined) {
          if (recipe.servings < filters.servingsRange[0] || 
              recipe.servings > filters.servingsRange[1]) {
            return false;
          }
        }
        
        // Ingredients count filter
        if (filters.minIngredients !== null || filters.maxIngredients !== null) {
          const ingredientsCount = recipe.ingredients 
            ? recipe.ingredients.split('\n').filter(i => i.trim()).length 
            : 0;
          
          if (filters.minIngredients !== null && ingredientsCount < filters.minIngredients) {
            return false;
          }
          
          if (filters.maxIngredients !== null && ingredientsCount > filters.maxIngredients) {
            return false;
          }
        }
        
        // Description filter
        if (filters.hasDescription === true && !recipe.description) {
          return false;
        }
      }
      
      return true;
    });

    // Apply sorting to recipe nodes
    if (filters.sortBy !== 'relevance') {
      filteredNodes = filteredNodes.map(node => {
        if (node.type === 'tag' && node.children) {
          // Sort children recursively
          const sortedChildren = applyFiltersAndSorting(node.children);
          return { ...node, children: sortedChildren };
        }
        return node;
      });

      // Sort recipe nodes
      const recipeNodes = filteredNodes.filter(node => node.type === 'recipe');
      const tagNodes = filteredNodes.filter(node => node.type === 'tag');
      
      recipeNodes.sort((a, b) => {
        if (!a.recipeData || !b.recipeData) return 0;
        
        let aValue: any, bValue: any;
        
        switch (filters.sortBy) {
          case 'title':
            aValue = a.recipeData.title.toLowerCase();
            bValue = b.recipeData.title.toLowerCase();
            break;
          case 'prep_time':
            aValue = a.recipeData.prep_time || 0;
            bValue = b.recipeData.prep_time || 0;
            break;
          case 'cook_time':
            aValue = a.recipeData.cook_time || 0;
            bValue = b.recipeData.cook_time || 0;
            break;
          case 'total_time':
            aValue = (a.recipeData.prep_time || 0) + (a.recipeData.cook_time || 0);
            bValue = (b.recipeData.prep_time || 0) + (b.recipeData.cook_time || 0);
            break;
          case 'servings':
            aValue = a.recipeData.servings || 0;
            bValue = b.recipeData.servings || 0;
            break;
          case 'created_at':
            // TreeNode recipeData doesn't include created_at, use ID as fallback
            aValue = a.recipeData.id || 0;
            bValue = b.recipeData.id || 0;
            break;
          default:
            return 0;
        }
        
        if (aValue < bValue) return filters.sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return filters.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
      
      filteredNodes = [...tagNodes, ...recipeNodes];
    }

    return filteredNodes;
  }, [filters]);

  const visibleNodes = applyFiltersAndSorting(activeTree);
  
  // Debug visible nodes
  console.log('🔴 Visible nodes:', visibleNodes.length);

  // Keyboard navigation
  const {
    focusedNodeId,
    initializeFocus,
    navigateToIndex
  } = useKeyboardNavigation({
    nodes: visibleNodes,
    onToggleExpansion: toggleNodeExpansion,
    onSelectNode: (node) => {
      if (node.type === 'recipe' && node.recipeData) {
        setSelectedRecipe(node.recipeData);
      }
    },
    isEnabled: keyboardNavigationEnabled && !useVirtualScrolling
  });

  // Drag and drop functionality
  const handleMoveNode = useCallback((draggedNode: TreeNode, targetNode: TreeNode, position: 'before' | 'after' | 'inside') => {
    // TODO: Implement actual tag reorganization API call
    console.log(`Moving ${draggedNode.name} ${position} ${targetNode.name}`);
    
    // For now, just show a notification
    // In a real implementation, this would call an API to reorganize tags
  }, []);

  const canDrop = useCallback((draggedNode: TreeNode, targetNode: TreeNode, position: 'before' | 'after' | 'inside') => {
    // Prevent dropping on self
    if (draggedNode.id === targetNode.id) return false;
    
    // Only allow dropping on tag nodes or as siblings
    if (position === 'inside' && targetNode.type === 'recipe') return false;
    
    // Prevent circular references (dropping parent into child)
    // This would need more sophisticated checking in a real implementation
    return true;
  }, []);

  const {
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
  } = useDragAndDrop({
    onMoveNode: handleMoveNode,
    canDrop,
    isEnabled: dragDropEnabled && !useVirtualScrolling
  });

  // Recipe comparison functions
  const handleAddToComparison = useCallback((recipe: Recipe) => {
    setComparisonRecipes(prev => {
      const isAlreadyInComparison = prev.some(r => r.id === recipe.id);
      if (isAlreadyInComparison) {
        return prev.filter(r => r.id !== recipe.id);
      } else {
        return [...prev, recipe];
      }
    });
  }, []);

  const handleRemoveFromComparison = useCallback((recipeId: string | number) => {
    setComparisonRecipes(prev => prev.filter(r => r.id?.toString() !== recipeId.toString()));
  }, []);

  const toggleComparisonMode = useCallback(() => {
    setComparisonMode(prev => !prev);
    if (comparisonMode) {
      setComparisonRecipes([]);
    }
  }, [comparisonMode]);

  const openComparison = useCallback(() => {
    if (comparisonRecipes.length > 1) {
      setShowComparison(true);
    }
  }, [comparisonRecipes.length]);

  // Auto-scroll to top when search changes
  useEffect(() => {
    if (treeContainerRef.current) {
      treeContainerRef.current.scrollTop = 0;
    }
  }, [query, searchResults]);

  // Determine if virtual scrolling should be used (for large datasets)
  useEffect(() => {
    const totalNodes = activeTree.filter(node => node.visible).length;
    setUseVirtualScrolling(totalNodes > 50); // Enable virtual scrolling for 50+ items
  }, [activeTree]);

  // Initialize keyboard focus when nodes are available
  useEffect(() => {
    if (visibleNodes.length > 0 && keyboardNavigationEnabled && !useVirtualScrolling) {
      const timer = setTimeout(() => {
        initializeFocus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [visibleNodes.length, keyboardNavigationEnabled, useVirtualScrolling, initializeFocus]);

  // Render function for virtual scrolling - MUST be defined before any conditional returns
  const renderVirtualNode = useCallback((node: TreeNode, level: number, index: number) => {
    return (
      <TreeNodeComponent
        key={node.id}
        node={node}
        level={level}
        onToggleExpansion={toggleNodeExpansion}
        onRecipeSelect={setSelectedRecipe}
        isVisible={node.visible}
        isFocused={false} // Virtual scrolling disables keyboard nav
      />
    );
  }, [toggleNodeExpansion]);

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

  // Debug: Handle case where search found results but tree is empty
  if (query && searchResults.length > 0 && visibleNodes.length === 0) {
    console.error('🔴 DEBUG: Search found results but tree is empty!');
    console.error('🔴 Search results:', searchResults);
    console.error('🔴 Tree nodes:', tree);
    console.error('🔴 Visible nodes:', visibleNodes);
    
    return (
      <div className="no-results">
        <div className="no-results-icon">⚠️</div>
        <h3>Search results found but not displaying</h3>
        <p>Found {searchResults.length} search results but they're not showing in the tree.</p>
        <p>Check console for debug information.</p>
      </div>
    );
  }

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

        <button
          className={`control-button comparison-toggle ${comparisonMode ? 'active' : ''}`}
          onClick={toggleComparisonMode}
        >
          ⚖️ Compare
        </button>

        {comparisonMode && comparisonRecipes.length > 0 && (
          <button
            className="control-button comparison-count"
            onClick={openComparison}
            disabled={comparisonRecipes.length < 2}
            title={`Compare ${comparisonRecipes.length} recipe${comparisonRecipes.length === 1 ? '' : 's'}`}
          >
            📊 Compare ({comparisonRecipes.length})
          </button>
        )}

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

        {keyboardNavigationEnabled && !useVirtualScrolling && (
          <div className="keyboard-nav-indicator">
            ⌨️ Use arrow keys to navigate • Enter to select • Space to expand
          </div>
        )}

        {dragDropEnabled && !useVirtualScrolling && (
          <div className="drag-drop-indicator">
            🖱️ Drag tags to reorganize hierarchy
          </div>
        )}

        {dragState.isDragging && (
          <div className="dragging-indicator">
            🚚 Dragging: {dragState.draggedNode?.name}
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
                isFocused={focusedNodeId === node.id}
                isDragging={isDraggedNode(node)}
                isDropTarget={isDropTarget(node)}
                dropIndicator={getDropIndicator(node)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isComparisonMode={comparisonMode}
                onAddToComparison={handleAddToComparison}
                isInComparison={comparisonRecipes.some(r => r.id?.toString() === node.recipeData?.id?.toString())}
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

      {/* Recipe comparison modal */}
      {showComparison && comparisonRecipes.length > 1 && (
        <RecipeComparison
          recipes={comparisonRecipes}
          onClose={() => setShowComparison(false)}
          onRemoveRecipe={handleRemoveFromComparison}
        />
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

        .keyboard-nav-indicator {
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid rgba(76, 175, 80, 0.2);
          color: #4caf50;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .drag-drop-indicator {
          background: rgba(255, 152, 0, 0.1);
          border: 1px solid rgba(255, 152, 0, 0.2);
          color: #ff9800;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
        }

        .dragging-indicator {
          background: rgba(33, 150, 243, 0.1);
          border: 1px solid rgba(33, 150, 243, 0.2);
          color: #2196f3;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          animation: pulse-drag 1s ease-in-out infinite alternate;
        }

        @keyframes pulse-drag {
          from { opacity: 0.7; }
          to { opacity: 1; }
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

        .tree-node.focused {
          background: rgba(33, 150, 243, 0.1);
          border: 2px solid #2196f3;
          outline: none;
        }

        .tree-node.focused.highlighted {
          background: rgba(255, 235, 59, 0.3);
          border: 2px solid #ff9800;
        }

        .tree-node.dragging {
          opacity: 0.5;
          background: rgba(33, 150, 243, 0.1);
          border: 2px dashed #2196f3;
          cursor: grabbing;
        }

        .tree-node.drop-target {
          background: rgba(76, 175, 80, 0.1);
        }

        .tree-node.drop-before {
          border-top: 3px solid #4caf50;
        }

        .tree-node.drop-after {
          border-bottom: 3px solid #4caf50;
        }

        .tree-node.drop-inside {
          background: rgba(76, 175, 80, 0.2);
          border: 2px solid #4caf50;
        }

        .tree-node[draggable="true"] {
          cursor: grab;
        }

        .tree-node[draggable="true"]:hover {
          background: rgba(33, 150, 243, 0.05);
        }

        .drop-indicator {
          position: relative;
          height: 0;
        }

        .drop-line {
          height: 2px;
          background: #4caf50;
          border-radius: 1px;
          position: relative;
        }

        .drop-line::before,
        .drop-line::after {
          content: '';
          position: absolute;
          top: -3px;
          width: 6px;
          height: 6px;
          background: #4caf50;
          border-radius: 50%;
        }

        .drop-line::before {
          left: -3px;
        }

        .drop-line::after {
          right: -3px;
        }

        .drop-highlight {
          background: rgba(76, 175, 80, 0.1);
          border: 1px dashed #4caf50;
          color: #4caf50;
          padding: 0.5rem;
          text-align: center;
          font-size: 0.8rem;
          border-radius: 4px;
          margin: 0.25rem 0;
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

        .recipe-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .compare-button {
          background: rgba(156, 39, 176, 0.1);
          border: 1px solid rgba(156, 39, 176, 0.3);
          color: #9c27b0;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .compare-button:hover {
          background: rgba(156, 39, 176, 0.2);
          border-color: rgba(156, 39, 176, 0.5);
        }

        .compare-button.in-comparison {
          background: #9c27b0;
          color: white;
          border-color: #9c27b0;
        }

        .tree-node.comparison-mode.recipe-node:hover {
          background: rgba(156, 39, 176, 0.05);
        }

        .tree-node.in-comparison {
          background: rgba(156, 39, 176, 0.1);
          border-left: 3px solid #9c27b0;
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