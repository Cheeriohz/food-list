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

## Performance Optimizations for Large-Scale Datasets

### Overview: Handling 100,000+ Records

The search system is designed to handle massive datasets efficiently through multi-layered optimization strategies. At 100k records, we implement enterprise-grade search patterns used by systems like Elasticsearch and Lucene.

### Search Architecture for Scale

#### 1. Multi-Tiered Search Index

```typescript
interface SearchArchitecture {
  // Tier 1: Inverted Index (Primary)
  invertedIndex: Map<string, PostingList>;
  
  // Tier 2: N-gram Index (Fuzzy matching)
  ngramIndex: Map<string, Set<number>>;
  
  // Tier 3: Semantic Clusters (Related terms)
  semanticIndex: Map<string, ClusterInfo>;
  
  // Tier 4: LRU Cache (Hot queries)
  queryCache: LRUCache<string, SearchResult[]>;
}

interface PostingList {
  termFrequency: Map<number, number>; // document_id -> frequency
  documentFrequency: number; // total docs containing term
  positions: Map<number, number[]>; // document_id -> [positions]
}

class ScalableSearchEngine {
  private indices: SearchArchitecture;
  private searchMetrics: SearchMetrics;
  
  // Memory-efficient index building
  async buildIndex(recipes: Recipe[], tags: Tag[]): Promise<void> {
    console.time('Index Build');
    
    // Process in chunks to avoid memory spikes
    const CHUNK_SIZE = 1000;
    const totalChunks = Math.ceil(recipes.length / CHUNK_SIZE);
    
    for (let i = 0; i < totalChunks; i++) {
      const chunk = recipes.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await this.processChunk(chunk);
      
      // Yield control to prevent UI blocking
      if (i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    await this.optimizeIndex();
    console.timeEnd('Index Build');
  }
  
  private async processChunk(recipes: Recipe[]): Promise<void> {
    const batch = new Map<string, Set<number>>();
    
    recipes.forEach(recipe => {
      const tokens = this.advancedTokenize(recipe);
      tokens.forEach(({ token, weight, positions }) => {
        this.addToInvertedIndex(token, recipe.id!, weight, positions);
        this.addToNgramIndex(token, recipe.id!);
      });
    });
  }
}
```

#### 2. Advanced Tokenization and Scoring

```typescript
interface TokenInfo {
  token: string;
  weight: number; // TF-IDF weight
  positions: number[]; // Character positions
  field: 'title' | 'description' | 'ingredients' | 'tags';
}

class AdvancedTokenizer {
  private stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
  private stemmer = new PorterStemmer();
  
  advancedTokenize(recipe: Recipe): TokenInfo[] {
    const tokens: TokenInfo[] = [];
    
    // Weighted field processing
    const fields = [
      { content: recipe.title, weight: 3.0, field: 'title' as const },
      { content: recipe.tags?.map(t => t.name).join(' ') || '', weight: 2.5, field: 'tags' as const },
      { content: recipe.description || '', weight: 1.5, field: 'description' as const },
      { content: recipe.ingredients, weight: 2.0, field: 'ingredients' as const }
    ];
    
    fields.forEach(({ content, weight, field }) => {
      const fieldTokens = this.tokenizeField(content, weight, field);
      tokens.push(...fieldTokens);
    });
    
    return tokens;
  }
  
  private tokenizeField(content: string, weight: number, field: string): TokenInfo[] {
    const tokens: TokenInfo[] = [];
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    
    words.forEach((word, index) => {
      if (this.stopWords.has(word) || word.length < 3) return;
      
      // Original word
      tokens.push({
        token: word,
        weight,
        positions: [index],
        field: field as any
      });
      
      // Stemmed version
      const stemmed = this.stemmer.stem(word);
      if (stemmed !== word) {
        tokens.push({
          token: stemmed,
          weight: weight * 0.8, // Slightly lower weight for stemmed
          positions: [index],
          field: field as any
        });
      }
      
      // N-grams for fuzzy matching
      if (word.length >= 4) {
        for (let i = 0; i <= word.length - 3; i++) {
          const ngram = word.substring(i, i + 3);
          tokens.push({
            token: `#${ngram}#`, // Mark as n-gram
            weight: weight * 0.5,
            positions: [index],
            field: field as any
          });
        }
      }
    });
    
    return tokens;
  }
}
```

#### 3. Optimized Search Execution

```typescript
interface SearchPerformanceConfig {
  maxResults: number; // Limit result set size
  searchTimeout: number; // Prevent runaway queries
  cacheSize: number; // LRU cache size
  minQueryLength: number; // Minimum query length
  debounceMs: number; // Debounce search input
}

class PerformantSearchExecution {
  private config: SearchPerformanceConfig = {
    maxResults: 100,
    searchTimeout: 500, // 500ms max
    cacheSize: 1000,
    minQueryLength: 2,
    debounceMs: 150
  };
  
  async search(query: string): Promise<SearchResult[]> {
    // Performance guards
    if (query.length < this.config.minQueryLength) return [];
    
    // Check cache first
    const cached = this.indices.queryCache.get(query);
    if (cached) return cached;
    
    // Execute with timeout
    return Promise.race([
      this.executeSearch(query),
      this.timeoutPromise(this.config.searchTimeout)
    ]);
  }
  
  private async executeSearch(query: string): Promise<SearchResult[]> {
    const startTime = performance.now();
    
    // Multi-stage search pipeline
    const results = await this.pipelineSearch(query);
    
    const endTime = performance.now();
    this.searchMetrics.recordSearch(query, endTime - startTime, results.length);
    
    // Cache successful results
    if (results.length > 0) {
      this.indices.queryCache.set(query, results);
    }
    
    return results;
  }
  
  private async pipelineSearch(query: string): Promise<SearchResult[]> {
    // Stage 1: Fast exact matches (title, tags)
    const exactMatches = await this.exactMatchSearch(query);
    if (exactMatches.length >= this.config.maxResults) {
      return exactMatches.slice(0, this.config.maxResults);
    }
    
    // Stage 2: Prefix matches
    const prefixMatches = await this.prefixMatchSearch(query);
    const combined = this.mergeResults(exactMatches, prefixMatches);
    if (combined.length >= this.config.maxResults) {
      return combined.slice(0, this.config.maxResults);
    }
    
    // Stage 3: Fuzzy matches (n-grams)
    const fuzzyMatches = await this.fuzzyMatchSearch(query);
    const final = this.mergeResults(combined, fuzzyMatches);
    
    return final.slice(0, this.config.maxResults);
  }
  
  private async exactMatchSearch(query: string): Promise<SearchResult[]> {
    const tokens = query.toLowerCase().split(/\s+/);
    const candidateSets: Set<number>[] = [];
    
    // Get posting lists for each token
    tokens.forEach(token => {
      const postingList = this.indices.invertedIndex.get(token);
      if (postingList) {
        candidateSets.push(new Set(postingList.termFrequency.keys()));
      }
    });
    
    if (candidateSets.length === 0) return [];
    
    // Intersection for AND semantics
    const intersection = candidateSets.reduce((acc, set) => 
      new Set([...acc].filter(id => set.has(id)))
    );
    
    // Score and sort
    return Array.from(intersection)
      .map(id => ({
        id,
        score: this.calculateTFIDFScore(id, tokens),
        type: 'recipe' as const,
        matchType: 'exact' as const
      }))
      .sort((a, b) => b.score - a.score);
  }
  
  private calculateTFIDFScore(documentId: number, queryTokens: string[]): number {
    let score = 0;
    const documentLength = this.getDocumentLength(documentId);
    
    queryTokens.forEach(token => {
      const postingList = this.indices.invertedIndex.get(token);
      if (!postingList) return;
      
      const tf = postingList.termFrequency.get(documentId) || 0;
      const df = postingList.documentFrequency;
      const totalDocs = this.getTotalDocumentCount();
      
      // TF-IDF calculation
      const tfScore = tf / documentLength;
      const idfScore = Math.log(totalDocs / (df + 1));
      
      score += tfScore * idfScore;
    });
    
    return score;
  }
}
```

### Memory Management for Large Datasets

#### 1. Lazy Loading and Pagination

```typescript
class LazySearchResults {
  private loadedPages = new Map<number, SearchResult[]>();
  private pageSize = 20;
  
  async getPage(pageIndex: number): Promise<SearchResult[]> {
    if (this.loadedPages.has(pageIndex)) {
      return this.loadedPages.get(pageIndex)!;
    }
    
    const page = await this.loadPage(pageIndex);
    this.loadedPages.set(pageIndex, page);
    
    // Garbage collect old pages
    if (this.loadedPages.size > 10) {
      const oldestPage = Math.min(...this.loadedPages.keys());
      this.loadedPages.delete(oldestPage);
    }
    
    return page;
  }
  
  private async loadPage(pageIndex: number): Promise<SearchResult[]> {
    const offset = pageIndex * this.pageSize;
    // Load only necessary recipe data for initial display
    return this.searchEngine.searchPaginated(this.currentQuery, offset, this.pageSize);
  }
}
```

#### 2. Incremental Index Updates

```typescript
class IncrementalIndexManager {
  private indexVersion = 0;
  private pendingUpdates: IndexUpdate[] = [];
  private updateBatchSize = 100;
  
  async updateIndex(changes: DataChange[]): Promise<void> {
    this.pendingUpdates.push(...changes.map(change => ({
      type: change.type,
      data: change.data,
      timestamp: Date.now()
    })));
    
    // Batch updates for efficiency
    if (this.pendingUpdates.length >= this.updateBatchSize) {
      await this.processPendingUpdates();
    }
  }
  
  private async processPendingUpdates(): Promise<void> {
    const updates = this.pendingUpdates.splice(0, this.updateBatchSize);
    
    // Group by operation type
    const groups = {
      insertions: updates.filter(u => u.type === 'insert'),
      updates: updates.filter(u => u.type === 'update'),
      deletions: updates.filter(u => u.type === 'delete')
    };
    
    // Process in order: deletions, updates, insertions
    await this.processDeleteions(groups.deletions);
    await this.processUpdates(groups.updates);
    await this.processInsertions(groups.insertions);
    
    this.indexVersion++;
    this.invalidateQueryCache();
  }
}
```

### Performance Benchmarks and Expectations

#### Expected Performance at Scale

| Dataset Size | Index Build Time | Memory Usage | Search Latency | 
|--------------|------------------|--------------|----------------|
| 1,000 recipes | 50ms | 2MB | 5-10ms |
| 10,000 recipes | 500ms | 15MB | 10-20ms |
| 100,000 recipes | 5-8s | 120MB | 20-50ms |
| 500,000 recipes | 25-40s | 500MB | 50-100ms |

#### Performance Monitoring

```typescript
class SearchMetrics {
  private metrics = {
    searchLatency: new PerformanceBuffer(1000),
    indexBuildTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    queryFrequency: new Map<string, number>()
  };
  
  recordSearch(query: string, latency: number, resultCount: number): void {
    this.metrics.searchLatency.add(latency);
    this.metrics.queryFrequency.set(
      query, 
      (this.metrics.queryFrequency.get(query) || 0) + 1
    );
    
    // Performance alerts
    if (latency > 200) {
      console.warn(`Slow search query: "${query}" took ${latency}ms`);
    }
  }
  
  getPerformanceReport(): PerformanceReport {
    return {
      averageLatency: this.metrics.searchLatency.average(),
      p95Latency: this.metrics.searchLatency.percentile(95),
      memoryUsage: this.estimateMemoryUsage(),
      cacheEfficiency: this.calculateCacheEfficiency(),
      topQueries: this.getTopQueries(10)
    };
  }
}
```

### Scalability Strategies

#### 1. Web Workers for Heavy Operations

```typescript
// search-worker.ts
class SearchWorker {
  private searchEngine: ScalableSearchEngine;
  
  async initialize(recipes: Recipe[], tags: Tag[]): Promise<void> {
    this.searchEngine = new ScalableSearchEngine();
    await this.searchEngine.buildIndex(recipes, tags);
    postMessage({ type: 'INIT_COMPLETE' });
  }
  
  async search(query: string): Promise<SearchResult[]> {
    const results = await this.searchEngine.search(query);
    return results;
  }
}

// Main thread usage
class WorkerSearchService {
  private worker: Worker;
  private ready = false;
  
  constructor() {
    this.worker = new Worker('/search-worker.js');
    this.worker.onmessage = this.handleMessage.bind(this);
  }
  
  async search(query: string): Promise<SearchResult[]> {
    if (!this.ready) throw new Error('Search service not ready');
    
    return new Promise((resolve) => {
      const requestId = Math.random().toString(36);
      
      this.worker.postMessage({
        type: 'SEARCH',
        requestId,
        query
      });
      
      const handler = (event: MessageEvent) => {
        if (event.data.requestId === requestId) {
          this.worker.removeEventListener('message', handler);
          resolve(event.data.results);
        }
      };
      
      this.worker.addEventListener('message', handler);
    });
  }
}
```

#### 2. Progressive Enhancement

```typescript
class ProgressiveSearchUX {
  private fastSearchThreshold = 1000; // Records below this use simple search
  private datasetSize: number;
  
  determineSearchStrategy(datasetSize: number): SearchStrategy {
    if (datasetSize < this.fastSearchThreshold) {
      return new SimpleClientSearch(); // Fast, simple implementation
    } else if (datasetSize < 50000) {
      return new OptimizedClientSearch(); // Advanced indexing
    } else {
      return new HybridServerSearch(); // Server-side search with client caching
    }
  }
  
  async initializeSearch(recipes: Recipe[], tags: Tag[]): Promise<void> {
    this.datasetSize = recipes.length;
    const strategy = this.determineSearchStrategy(this.datasetSize);
    
    // Show loading indicator for large datasets
    if (this.datasetSize > 10000) {
      this.showIndexingProgress();
    }
    
    await strategy.initialize(recipes, tags);
    this.hideIndexingProgress();
  }
}
```

### Database Optimization for Search

#### Optimized Queries for Large Datasets

```sql
-- Create specialized indexes for search
CREATE INDEX idx_recipes_search_vector ON recipes(
  title, description, ingredients
) WHERE length(title) > 0;

-- Full-text search index (SQLite FTS5)
CREATE VIRTUAL TABLE recipes_fts USING fts5(
  title, description, ingredients, tags,
  content='recipes',
  content_rowid='id'
);

-- Materialized search view
CREATE VIEW recipe_search_data AS
SELECT 
  r.id,
  r.title,
  r.description,
  r.ingredients,
  GROUP_CONCAT(t.name, ' ') as tag_names,
  -- Pre-computed search tokens
  (r.title || ' ' || COALESCE(r.description, '') || ' ' || 
   r.ingredients || ' ' || GROUP_CONCAT(t.name, ' ')) as search_text
FROM recipes r
LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
LEFT JOIN tags t ON rt.tag_id = t.id
GROUP BY r.id;

-- Optimized search query
SELECT r.*, ts.rank
FROM recipes r
JOIN (
  SELECT rowid as id, rank
  FROM recipes_fts 
  WHERE recipes_fts MATCH ?
  ORDER BY rank
  LIMIT 100
) ts ON r.id = ts.id
ORDER BY ts.rank;
```

This architecture ensures that even with 100,000+ recipes, search remains responsive with sub-100ms latency for most queries, while maintaining a smooth user experience through progressive loading and efficient memory management.
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