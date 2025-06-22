# Hierarchical Search Interface Feature

## Problem Statement

The current dual-panel design (tag tree + recipe grid) creates a disconnected user experience where tags and recipes feel like separate entities. Users need to mentally map relationships between the tag filtering sidebar and recipe results. This design doesn't leverage the natural hierarchical relationship between tags and recipes.

## Solution Overview

Transform the interface into a **unified hierarchical tree** where recipes are displayed as leaf nodes under their associated tags. Implement a **search-first approach** with progressive disclosure, where the interface remains clean until users begin searching, then dynamically reveals relevant tag-recipe relationships.

## Core Design Principles

1. **Search-First**: Nothing displays until user starts typing
2. **Unified Hierarchy**: Tags and recipes in single tree structure  
3. **Progressive Disclosure**: Compact → Expanded recipe cards on interaction
4. **Contextual Relationships**: Recipes appear under their relevant tags
5. **Performance-Oriented**: Efficient rendering for large datasets

## User Experience Flow

### Initial State
```
┌─────────────────────────────────────┐
│              Recipe Manager          │
├─────────────────────────────────────┤
│                                     │
│        🔍 Search recipes and tags   │
│        ┌─────────────────────────┐   │
│        │                         │   │
│        └─────────────────────────┘   │
│                                     │
│     Type to discover recipes...     │
│                                     │
└─────────────────────────────────────┘
```

### Search Active State
```
┌─────────────────────────────────────┐
│              Recipe Manager          │
├─────────────────────────────────────┤
│        🔍 "chicken pasta"           │
│        ┌─────────────────────────┐   │
│        │ chicken pasta           │   │
│        └─────────────────────────┘   │
│                                     │
│  📁 Main Dishes                     │
│    📁 Italian                       │
│      📄 Chicken Alfredo Pasta ⭐    │
│      📄 Creamy Chicken Penne        │
│    📁 Asian                         │
│      📄 Chicken Pad Thai            │
│  📁 Quick Meals                     │
│      📄 15-Min Chicken Pasta        │
│                                     │
└─────────────────────────────────────┘
```

### Expanded Recipe State
```
┌─────────────────────────────────────┐
│  📁 Main Dishes                     │
│    📁 Italian                       │
│      ┌─────────────────────────────┐ │
│      │ 🍝 Chicken Alfredo Pasta    │ │
│      │ ⭐⭐⭐⭐⭐ 45 min | 4 servings│ │
│      │                             │ │
│      │ Rich, creamy pasta with...  │ │
│      │                             │ │
│      │ 📋 Ingredients: chicken,    │ │
│      │    pasta, cream, garlic...  │ │
│      │                             │ │
│      │ [View Full Recipe] [Edit]   │ │
│      └─────────────────────────────┘ │
│      📄 Creamy Chicken Penne        │
└─────────────────────────────────────┘
```

## Technical Architecture

### Component Hierarchy

```
App.tsx (Redesigned)
├── SearchCentricLayout.tsx (New)
│   ├── UnifiedSearchBar.tsx (Enhanced)
│   └── HierarchicalResultsTree.tsx (New)
│       ├── TagNode.tsx (Enhanced)
│       │   ├── ExpandableRecipeCard.tsx (New)
│       │   │   ├── CompactRecipeView.tsx (New)
│       │   │   └── ExpandedRecipeView.tsx (New)
│       │   └── TagNode.tsx (Recursive)
│       └── VirtualizedTree.tsx (Performance)
```

### Data Structure Design

#### Unified Tree Node Structure
```typescript
interface TreeNode {
  id: string;
  type: 'tag' | 'recipe';
  name: string;
  level: number;
  expanded: boolean;
  visible: boolean;
  matchScore: number; // Search relevance 0-1
  children: TreeNode[];
  
  // Tag-specific properties
  tagData?: {
    id: number;
    parent_tag_id: number | null;
    recipeCount: number;
  };
  
  // Recipe-specific properties  
  recipeData?: {
    id: number;
    title: string;
    description: string;
    ingredients: string;
    instructions: string;
    prep_time?: number;
    cook_time?: number;
    servings?: number;
    tags: Tag[];
    thumbnail?: string;
  };
}
```

#### Search Index Structure
```typescript
interface SearchIndex {
  recipes: Map<number, RecipeSearchData>;
  tags: Map<number, TagSearchData>;
  tokenIndex: Map<string, Set<number>>; // word -> recipe/tag IDs
}

interface RecipeSearchData {
  id: number;
  title: string;
  description: string;
  ingredients: string[];
  searchTokens: string[];
  tagIds: number[];
}

interface TagSearchData {
  id: number;
  name: string;
  searchTokens: string[];
  recipeIds: number[];
  path: string[]; // Full hierarchy path
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (8-10 hours)

#### 1.1 Data Layer Redesign
- **SearchIndexService**: Build efficient search index
- **TreeDataService**: Transform flat data into hierarchical structure
- **SearchEngine**: Implement fuzzy search with scoring

```typescript
// New service architecture
class SearchIndexService {
  private index: SearchIndex;
  
  buildIndex(recipes: Recipe[], tags: Tag[]): SearchIndex
  search(query: string): SearchResult[]
  updateIndex(changes: DataChange[]): void
}

class TreeDataService {
  buildTree(recipes: Recipe[], tags: Tag[], searchResults?: SearchResult[]): TreeNode[]
  filterTree(tree: TreeNode[], query: string): TreeNode[]
  expandPath(tree: TreeNode[], nodeId: string): TreeNode[]
}
```

#### 1.2 New Context Architecture
```typescript
// Enhanced context for unified data
interface UnifiedDataContextType {
  // Data
  tree: TreeNode[];
  searchQuery: string;
  searchResults: SearchResult[];
  expandedNodes: Set<string>;
  highlightedNode: string | null;
  
  // Actions
  setSearchQuery: (query: string) => void;
  toggleNodeExpansion: (nodeId: string) => void;
  highlightNode: (nodeId: string | null) => void;
  loadRecipeDetails: (recipeId: number) => Promise<Recipe>;
  
  // State
  loading: boolean;
  error: string | null;
}
```

### Phase 2: Search-First Interface (6-8 hours)

#### 2.1 SearchCentricLayout Component
```typescript
interface SearchCentricLayoutProps {
  children?: React.ReactNode;
}

const SearchCentricLayout: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  return (
    <div className="search-centric-layout">
      <header className="search-header">
        <h1>Recipe Manager</h1>
        <UnifiedSearchBar 
          query={searchQuery}
          onChange={setSearchQuery}
          onFocus={() => setShowResults(true)}
        />
      </header>
      
      <main className="search-results">
        {showResults && searchQuery.length > 0 ? (
          <HierarchicalResultsTree query={searchQuery} />
        ) : (
          <EmptySearchState />
        )}
      </main>
    </div>
  );
};
```

#### 2.2 Enhanced Search Bar
```typescript
interface UnifiedSearchBarProps {
  query: string;
  onChange: (query: string) => void;
  onFocus?: () => void;
  placeholder?: string;
}

const UnifiedSearchBar: React.FC<UnifiedSearchBarProps> = ({
  query,
  onChange,
  onFocus,
  placeholder = "Search recipes, ingredients, or categories..."
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const { searchSuggestions } = useUnifiedData();
  
  // Real-time search suggestions
  useEffect(() => {
    if (query.length > 1) {
      setSuggestions(searchSuggestions(query));
    }
  }, [query, searchSuggestions]);
  
  return (
    <div className="unified-search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="search-input"
      />
      
      {suggestions.length > 0 && (
        <SearchSuggestions 
          suggestions={suggestions}
          onSelect={(suggestion) => onChange(suggestion.text)}
        />
      )}
    </div>
  );
};
```

### Phase 3: Hierarchical Tree Component (10-12 hours)

#### 3.1 Main Tree Component
```typescript
interface HierarchicalResultsTreeProps {
  query: string;
}

const HierarchicalResultsTree: React.FC<HierarchicalResultsTreeProps> = ({ query }) => {
  const { tree, loading, expandedNodes, toggleNodeExpansion } = useUnifiedData();
  const [virtualizedData, setVirtualizedData] = useState<VirtualItem[]>([]);
  
  // Virtual scrolling for performance
  const { containerRef, itemRefs } = useVirtualization({
    itemCount: virtualizedData.length,
    itemHeight: 60, // Base height, dynamic for expanded cards
    overscan: 5
  });
  
  return (
    <div ref={containerRef} className="hierarchical-tree">
      {virtualizedData.map((item, index) => (
        <TreeNodeRenderer
          key={item.id}
          node={item.node}
          level={item.level}
          onToggleExpansion={toggleNodeExpansion}
          query={query}
        />
      ))}
    </div>
  );
};
```

#### 3.2 Tree Node Renderer
```typescript
interface TreeNodeRendererProps {
  node: TreeNode;
  level: number;
  onToggleExpansion: (nodeId: string) => void;
  query: string;
}

const TreeNodeRenderer: React.FC<TreeNodeRendererProps> = ({
  node,
  level,
  onToggleExpansion,
  query
}) => {
  if (node.type === 'tag') {
    return (
      <TagNode
        tag={node}
        level={level}
        onToggleExpansion={onToggleExpansion}
        searchQuery={query}
      />
    );
  }
  
  return (
    <ExpandableRecipeCard
      recipe={node}
      level={level}
      searchQuery={query}
    />
  );
};
```

### Phase 4: Expandable Recipe Cards (8-10 hours)

#### 4.1 Recipe Card Component
```typescript
interface ExpandableRecipeCardProps {
  recipe: TreeNode; // TreeNode with recipeData
  level: number;
  searchQuery: string;
}

const ExpandableRecipeCard: React.FC<ExpandableRecipeCardProps> = ({
  recipe,
  level,
  searchQuery
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { highlightNode } = useUnifiedData();
  
  const recipeData = recipe.recipeData!;
  
  const handleMouseEnter = () => {
    setIsHovered(true);
    highlightNode(recipe.id);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    highlightNode(null);
  };
  
  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div 
      className={`expandable-recipe-card level-${level} ${isExpanded ? 'expanded' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {isExpanded ? (
        <ExpandedRecipeView 
          recipe={recipeData}
          searchQuery={searchQuery}
          onCollapse={() => setIsExpanded(false)}
        />
      ) : (
        <CompactRecipeView 
          recipe={recipeData}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
};
```

#### 4.2 Compact Recipe View
```typescript
const CompactRecipeView: React.FC<{
  recipe: Recipe;
  searchQuery: string;
}> = ({ recipe, searchQuery }) => {
  return (
    <div className="compact-recipe-view">
      <div className="recipe-header">
        <span className="recipe-icon">📄</span>
        <h4 className="recipe-title">
          <HighlightedText text={recipe.title} highlight={searchQuery} />
        </h4>
        <div className="recipe-meta">
          {recipe.prep_time && <span>⏱️ {recipe.prep_time}min</span>}
          {recipe.servings && <span>👥 {recipe.servings}</span>}
        </div>
      </div>
      
      {recipe.description && (
        <p className="recipe-description">
          <HighlightedText 
            text={recipe.description.substring(0, 100) + '...'} 
            highlight={searchQuery} 
          />
        </p>
      )}
      
      <div className="recipe-tags">
        {recipe.tags.slice(0, 3).map(tag => (
          <TagChip key={tag.id} tag={tag} size="small" variant="normal" />
        ))}
        {recipe.tags.length > 3 && <span className="more-tags">+{recipe.tags.length - 3}</span>}
      </div>
    </div>
  );
};
```

#### 4.3 Expanded Recipe View
```typescript
const ExpandedRecipeView: React.FC<{
  recipe: Recipe;
  searchQuery: string;
  onCollapse: () => void;
}> = ({ recipe, searchQuery, onCollapse }) => {
  const { updateRecipeTags } = useRecipes();
  const [isEditingTags, setIsEditingTags] = useState(false);
  
  return (
    <div className="expanded-recipe-view">
      <div className="recipe-header-expanded">
        <div className="title-section">
          <h3>
            <HighlightedText text={recipe.title} highlight={searchQuery} />
          </h3>
          <div className="recipe-meta-expanded">
            {recipe.prep_time && <span>⏱️ Prep: {recipe.prep_time}min</span>}
            {recipe.cook_time && <span>🔥 Cook: {recipe.cook_time}min</span>}
            {recipe.servings && <span>👥 Serves: {recipe.servings}</span>}
          </div>
        </div>
        
        <div className="action-buttons">
          <button onClick={() => setIsEditingTags(!isEditingTags)}>
            Edit Tags
          </button>
          <button onClick={() => window.open(`/recipe/${recipe.id}`, '_blank')}>
            View Full Recipe
          </button>
          <button onClick={onCollapse} className="collapse-btn">
            ✕
          </button>
        </div>
      </div>
      
      {recipe.description && (
        <div className="recipe-description-expanded">
          <HighlightedText text={recipe.description} highlight={searchQuery} />
        </div>
      )}
      
      <div className="recipe-content">
        <div className="ingredients-preview">
          <h4>Ingredients</h4>
          <HighlightedText 
            text={recipe.ingredients.substring(0, 200) + '...'} 
            highlight={searchQuery} 
          />
        </div>
        
        <div className="instructions-preview">
          <h4>Instructions</h4>
          <HighlightedText 
            text={recipe.instructions.substring(0, 200) + '...'} 
            highlight={searchQuery} 
          />
        </div>
      </div>
      
      <div className="recipe-tags-expanded">
        <h4>Tags</h4>
        <div className="tags-list">
          {recipe.tags.map(tag => (
            <TagChip key={tag.id} tag={tag} size="medium" variant="normal" />
          ))}
        </div>
      </div>
      
      {isEditingTags && recipe.id && (
        <RecipeTagEditor
          recipe={recipe}
          allTags={[]} // TODO: Get from context
          onSave={async (tagIds) => {
            await updateRecipeTags(recipe.id!, tagIds);
            setIsEditingTags(false);
          }}
          onCancel={() => setIsEditingTags(false)}
          isExpanded={true}
        />
      )}
    </div>
  );
};
```

## Performance Optimizations

### Virtual Scrolling Implementation
```typescript
const useVirtualization = ({
  itemCount,
  itemHeight,
  overscan = 5
}: VirtualizationOptions) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );
  
  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        offsetTop: i * itemHeight,
        height: itemHeight
      });
    }
    return items;
  }, [startIndex, endIndex, itemHeight]);
  
  return { visibleItems, totalHeight: itemCount * itemHeight };
};
```

### Search Index Optimization
```typescript
class OptimizedSearchEngine {
  private tokenIndex: Map<string, Set<number>> = new Map();
  private fuzzyMatcher: FuzzyMatcher;
  
  buildIndex(recipes: Recipe[], tags: Tag[]): void {
    // Build inverted index for fast lookups
    recipes.forEach(recipe => {
      const tokens = this.tokenize(recipe.title + ' ' + recipe.description + ' ' + recipe.ingredients);
      tokens.forEach(token => {
        if (!this.tokenIndex.has(token)) {
          this.tokenIndex.set(token, new Set());
        }
        this.tokenIndex.get(token)!.add(recipe.id!);
      });
    });
  }
  
  search(query: string): SearchResult[] {
    const queryTokens = this.tokenize(query);
    const candidateIds = this.getCandidateIds(queryTokens);
    
    return candidateIds
      .map(id => ({
        id,
        score: this.calculateRelevanceScore(id, queryTokens),
        type: 'recipe' as const
      }))
      .filter(result => result.score > 0.1)
      .sort((a, b) => b.score - a.score);
  }
  
  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }
}
```

## User Experience Enhancements

### Keyboard Navigation
```typescript
const useKeyboardNavigation = (tree: TreeNode[]) => {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          navigateToNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          navigateToPrevious();
          break;
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          expandFocusedNode();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          collapseFocusedNode();
          break;
        case 'Escape':
          e.preventDefault();
          clearFocus();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedNodeId, tree]);
  
  return { focusedNodeId, setFocusedNodeId };
};
```

### Accessibility Features
- **ARIA Landmarks**: Proper navigation structure
- **Screen Reader Support**: Descriptive labels and live regions
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Logical focus flow
- **High Contrast**: Support for accessibility preferences

## Mobile Responsiveness

### Responsive Design Patterns
```scss
.hierarchical-tree {
  // Desktop: Full hierarchy visible
  @media (min-width: 768px) {
    display: flex;
    flex-direction: column;
    padding: 1rem;
  }
  
  // Mobile: Collapsed by default, tap to expand
  @media (max-width: 767px) {
    .tag-node {
      &.collapsed .children {
        display: none;
      }
    }
    
    .expandable-recipe-card {
      margin: 0.5rem 0;
      
      &.expanded {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        background: white;
        overflow-y: auto;
      }
    }
  }
}
```

## Testing Strategy

### Unit Tests
- **Search Engine**: Test search accuracy and performance
- **Tree Operations**: Test expansion, filtering, and navigation
- **Component Rendering**: Test card states and interactions

### Integration Tests
- **Search Flow**: End-to-end search and result interaction
- **Data Loading**: Test with various data sizes
- **Performance**: Measure rendering performance with large datasets

### User Testing
- **Search Discoverability**: Can users find recipes effectively?
- **Navigation Intuition**: Is the hierarchy clear and logical?
- **Performance Perception**: Does the interface feel responsive?

## Migration Strategy

### Phase 1: Parallel Implementation
- Build new components alongside existing interface
- Feature flag to switch between old/new interfaces
- A/B testing with user feedback

### Phase 2: Data Migration
- Ensure search index builds correctly from existing data
- Verify recipe-tag relationships are preserved
- Performance testing with production data

### Phase 3: Gradual Rollout
- Beta users first
- Monitor performance metrics
- Gather user feedback and iterate

## Success Metrics

### User Experience
- **Search Success Rate**: % of searches that lead to recipe selection
- **Time to Recipe**: Average time from search to recipe view
- **Engagement**: Time spent exploring hierarchy vs. direct recipe access

### Technical Performance
- **Search Latency**: < 200ms for search results
- **Rendering Performance**: 60fps during scrolling and expansion
- **Memory Usage**: Efficient handling of large datasets

### Business Impact
- **Recipe Discovery**: Increase in unique recipes viewed per session
- **Tag Utilization**: Better tag-based recipe organization
- **User Retention**: Improved user session length and return rate

---

*This feature represents a fundamental UX transformation that aligns the interface with the natural hierarchical relationship between tags and recipes, while prioritizing search and discovery workflows.*