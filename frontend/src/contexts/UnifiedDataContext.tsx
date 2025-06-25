import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Recipe, Tag } from '../types';
import SearchIndexService, { SearchResult } from '../services/SearchIndexService';
import TreeDataService, { TreeNode, VirtualItem } from '../services/TreeDataService';

interface UnifiedDataState {
  // Core data
  recipes: Recipe[];
  tags: Tag[];
  tree: TreeNode[];
  virtualizedItems: VirtualItem[];
  
  // Search state
  searchQuery: string;
  searchResults: SearchResult[];
  searchSuggestions: string[];
  
  // UI state
  expandedNodes: Set<string>;
  highlightedNodeId: string | null;
  showResults: boolean;
  
  // Performance state
  loading: boolean;
  indexing: boolean;
  error: string | null;
  
  // Statistics
  treeStats: {
    totalNodes: number;
    visibleNodes: number;
    tagNodes: number;
    recipeNodes: number;
    maxDepth: number;
  };
}

type UnifiedDataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INDEXING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATA'; payload: { recipes: Recipe[]; tags: Tag[] } }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_SEARCH_SUGGESTIONS'; payload: string[] }
  | { type: 'SET_TREE'; payload: TreeNode[] }
  | { type: 'SET_VIRTUALIZED_ITEMS'; payload: VirtualItem[] }
  | { type: 'TOGGLE_NODE_EXPANSION'; payload: string }
  | { type: 'SET_EXPANDED_NODES'; payload: Set<string> }
  | { type: 'SET_HIGHLIGHTED_NODE'; payload: string | null }
  | { type: 'SET_SHOW_RESULTS'; payload: boolean }
  | { type: 'SET_TREE_STATS'; payload: UnifiedDataState['treeStats'] };

interface UnifiedDataContextType extends UnifiedDataState {
  // Search actions
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  getSuggestions: (partialQuery: string) => string[];
  
  // Tree actions
  toggleNodeExpansion: (nodeId: string) => void;
  expandPath: (nodeId: string) => void;
  collapseAll: () => void;
  expandAll: () => void;
  
  // Node actions
  highlightNode: (nodeId: string | null) => void;
  findNodeById: (nodeId: string) => TreeNode | null;
  
  // Data actions
  refreshData: () => Promise<void>;
  
  // Recipe actions (delegated to existing context)
  loadRecipeDetails: (recipeId: number) => Promise<Recipe | null>;
}

const initialState: UnifiedDataState = {
  recipes: [],
  tags: [],
  tree: [],
  virtualizedItems: [],
  searchQuery: '',
  searchResults: [],
  searchSuggestions: [],
  expandedNodes: new Set(),
  highlightedNodeId: null,
  showResults: false,
  loading: false,
  indexing: false,
  error: null,
  treeStats: {
    totalNodes: 0,
    visibleNodes: 0,
    tagNodes: 0,
    recipeNodes: 0,
    maxDepth: 0
  }
};

const unifiedDataReducer = (state: UnifiedDataState, action: UnifiedDataAction): UnifiedDataState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_INDEXING':
      return { ...state, indexing: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false, indexing: false };
    
    case 'SET_DATA':
      return { 
        ...state, 
        recipes: action.payload.recipes, 
        tags: action.payload.tags,
        loading: false 
      };
    
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
    
    case 'SET_SEARCH_SUGGESTIONS':
      return { ...state, searchSuggestions: action.payload };
    
    case 'SET_TREE':
      return { ...state, tree: action.payload };
    
    case 'SET_VIRTUALIZED_ITEMS':
      return { ...state, virtualizedItems: action.payload };
    
    case 'TOGGLE_NODE_EXPANSION': {
      const newExpanded = new Set(state.expandedNodes);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return { ...state, expandedNodes: newExpanded };
    }
    
    case 'SET_EXPANDED_NODES':
      return { ...state, expandedNodes: action.payload };
    
    case 'SET_HIGHLIGHTED_NODE':
      return { ...state, highlightedNodeId: action.payload };
    
    case 'SET_SHOW_RESULTS':
      return { ...state, showResults: action.payload };
    
    case 'SET_TREE_STATS':
      return { ...state, treeStats: action.payload };
    
    default:
      return state;
  }
};

const UnifiedDataContext = createContext<UnifiedDataContextType | undefined>(undefined);

interface UnifiedDataProviderProps {
  children: ReactNode;
}

export const UnifiedDataProvider: React.FC<UnifiedDataProviderProps> = ({ children }) => {
  console.log('🚀 UnifiedDataProvider: Component rendering - BASIC TEST');
  const [state, dispatch] = useReducer(unifiedDataReducer, initialState);
  console.log('🚀 UnifiedDataProvider: useReducer initialized');
  
  // Services
  const searchService = useMemo(() => new SearchIndexService(), []);
  const treeService = useMemo(() => new TreeDataService(), []);

  // Initialize data and build search index
  const initializeServices = useCallback(async (recipes: Recipe[], tags: Tag[]) => {
    dispatch({ type: 'SET_INDEXING', payload: true });
    
    try {
      // Initialize tree service
      treeService.initialize(recipes, tags);
      
      // Build search index
      await searchService.buildIndex(recipes, tags);
      
      dispatch({ type: 'SET_INDEXING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  }, [searchService, treeService]);

  // Load initial data
  const loadData = useCallback(async () => {
    console.log('📥 UnifiedDataContext: loadData called');
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Fetch recipes and tags from existing API
      console.log('📥 Fetching recipes and tags from API');
      const [recipesResponse, tagsResponse] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/tags')
      ]);
      
      if (!recipesResponse.ok || !tagsResponse.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const recipes: Recipe[] = await recipesResponse.json();
      const tags: Tag[] = await tagsResponse.json();
      
      console.log('📥 Fetched data - Recipes:', recipes.length, 'Tags:', tags.length);
      console.log('📥 Sample recipe:', recipes[0]);
      console.log('📥 Sample tag:', tags[0]);
      
      dispatch({ type: 'SET_DATA', payload: { recipes, tags } });
      
      // Initialize services with data
      console.log('📥 Initializing services with data');
      await initializeServices(recipes, tags);
      console.log('📥 Services initialized successfully');
      
    } catch (error) {
      console.error('📥 Error loading data:', error);
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  }, [initializeServices]);

  // Build tree when data or search changes
  const buildTree = useCallback(() => {
    if (state.recipes.length === 0 || state.indexing) {
      return;
    }
    
    const buildOptions = {
      searchResults: state.searchResults.length > 0 ? state.searchResults : undefined,
      expandedNodes: state.expandedNodes,
      maxDepth: 10,
      showEmptyTags: state.searchQuery.length === 0 // Show empty tags only when not searching
    };
    
    const tree = treeService.buildTree(buildOptions);
    console.log('🌳 Tree built:', tree.length, 'root nodes');
    
    dispatch({ type: 'SET_TREE', payload: tree });
    
    // Update tree statistics
    const stats = treeService.getTreeStatistics(tree);
    dispatch({ type: 'SET_TREE_STATS', payload: stats });
    
    // Build virtualized items for performance
    const virtualizedItems = treeService.flattenTreeForVirtualization(tree);
    dispatch({ type: 'SET_VIRTUALIZED_ITEMS', payload: virtualizedItems });
    
  }, [state.recipes, state.searchResults, state.expandedNodes, state.indexing, state.searchQuery, treeService]);

  // Search functionality
  const performSearch = useCallback(async (query: string) => {
    console.log('🔍 Search:', query);
    
    if (query.length < 2) {
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      return;
    }
    
    try {
      const results = await searchService.search(query, 100);
      console.log('🔍 Found:', results.length, 'results');
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: results });
    } catch (error) {
      console.error('🔍 Search failed:', error);
      dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
    }
  }, [searchService]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (state.searchQuery) {
        performSearch(state.searchQuery);
      } else {
        dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
      }
    }, 150); // 150ms debounce

    return () => clearTimeout(timeoutId);
  }, [state.searchQuery, performSearch]);

  // Rebuild tree when search results change
  useEffect(() => {
    buildTree();
  }, [buildTree]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Context methods
  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
    dispatch({ type: 'SET_SHOW_RESULTS', payload: query.length > 0 });
  }, []);

  const clearSearch = useCallback(() => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
    dispatch({ type: 'SET_SHOW_RESULTS', payload: false });
  }, []);

  const getSuggestions = useCallback((partialQuery: string): string[] => {
    return searchService.getSuggestions(partialQuery, 5);
  }, [searchService]);

  const toggleNodeExpansion = useCallback((nodeId: string) => {
    dispatch({ type: 'TOGGLE_NODE_EXPANSION', payload: nodeId });
  }, []);

  const expandPath = useCallback((nodeId: string) => {
    const updatedTree = treeService.expandPath(state.tree, nodeId);
    dispatch({ type: 'SET_TREE', payload: updatedTree });
  }, [state.tree, treeService]);

  const collapseAll = useCallback(() => {
    dispatch({ type: 'SET_EXPANDED_NODES', payload: new Set() });
  }, []);

  const expandAll = useCallback(() => {
    const allNodeIds = new Set<string>();
    
    const collectNodeIds = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'tag') { // Only expand tags, not recipes
          allNodeIds.add(node.id);
        }
        collectNodeIds(node.children);
      });
    };
    
    collectNodeIds(state.tree);
    dispatch({ type: 'SET_EXPANDED_NODES', payload: allNodeIds });
  }, [state.tree]);

  const highlightNode = useCallback((nodeId: string | null) => {
    dispatch({ type: 'SET_HIGHLIGHTED_NODE', payload: nodeId });
  }, []);

  const findNodeById = useCallback((nodeId: string): TreeNode | null => {
    return treeService.findNodeById(state.tree, nodeId);
  }, [state.tree, treeService]);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Load data on mount - using useEffect with proper dependencies
  useEffect(() => {
    console.log('📥 UnifiedDataContext: useEffect triggered, calling loadData');
    
    const initializeData = async () => {
      console.log('📥 Starting data initialization...');
      
      try {
        console.log('📥 Fetching from /api/recipes...');
        const recipesResponse = await fetch('/api/recipes');
        console.log('📥 Recipes response status:', recipesResponse.status, recipesResponse.ok);
        
        console.log('📥 Fetching from /api/tags...');
        const tagsResponse = await fetch('/api/tags');
        console.log('📥 Tags response status:', tagsResponse.status, tagsResponse.ok);
        
        if (!recipesResponse.ok || !tagsResponse.ok) {
          throw new Error(`API Error - Recipes: ${recipesResponse.status}, Tags: ${tagsResponse.status}`);
        }
        
        console.log('📥 Parsing JSON responses...');
        const recipes: Recipe[] = await recipesResponse.json();
        const tags: Tag[] = await tagsResponse.json();
        
        console.log('📥 ✅ Data fetched successfully!');
        console.log('📥 - Recipes count:', recipes.length);
        console.log('📥 - Tags count:', tags.length);
        console.log('📥 - Sample recipe:', recipes[0]);
        console.log('📥 - Sample tag:', tags[0]);
        
        // Set the data in state
        console.log('📥 Setting data in state...');
        dispatch({ type: 'SET_DATA', payload: { recipes, tags } });
        
        // Initialize services
        console.log('📥 Starting service initialization...');
        dispatch({ type: 'SET_INDEXING', payload: true });
        
        console.log('📥 Calling treeService.initialize...');
        treeService.initialize(recipes, tags);
        console.log('📥 ✅ treeService.initialize completed');
        
        console.log('📥 Calling searchService.buildIndex...');
        await searchService.buildIndex(recipes, tags);
        console.log('📥 ✅ searchService.buildIndex completed');
        
        dispatch({ type: 'SET_INDEXING', payload: false });
        console.log('📥 🎉 Data initialization completed successfully!');
        
      } catch (error) {
        console.error('📥 ❌ Error in data initialization:', error);
        console.error('📥 Error details:', error.message);
        console.error('📥 Error stack:', error.stack);
        dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      }
    };
    
    initializeData();
  }, []); // Empty dependency - run once on mount only

  const loadRecipeDetails = useCallback(async (recipeId: number): Promise<Recipe | null> => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (!response.ok) throw new Error('Failed to fetch recipe');
      return await response.json();
    } catch (error) {
      console.error('Failed to load recipe details:', error);
      return null;
    }
  }, []);

  const contextValue: UnifiedDataContextType = {
    // State
    ...state,
    
    // Search actions
    setSearchQuery,
    clearSearch,
    getSuggestions,
    
    // Tree actions
    toggleNodeExpansion,
    expandPath,
    collapseAll,
    expandAll,
    
    // Node actions
    highlightNode,
    findNodeById,
    
    // Data actions
    refreshData,
    
    // Recipe actions
    loadRecipeDetails
  };

  return (
    <UnifiedDataContext.Provider value={contextValue}>
      {children}
    </UnifiedDataContext.Provider>
  );
};

export const useUnifiedData = (): UnifiedDataContextType => {
  const context = useContext(UnifiedDataContext);
  if (!context) {
    throw new Error('useUnifiedData must be used within a UnifiedDataProvider');
  }
  return context;
};