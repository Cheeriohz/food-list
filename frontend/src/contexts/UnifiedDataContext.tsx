import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Recipe, Tag } from '../types';
import SearchIndexService, { SearchResult } from '../services/SearchIndexService';

interface UnifiedDataState {
  // Core data
  recipes: Recipe[];
  tags: Tag[];
  
  // Search state
  searchQuery: string;
  searchResults: SearchResult[];
  searchSuggestions: string[];
  
  // UI state
  showResults: boolean;
  selectedRecipeId: number | null;
  showRecipeDetail: boolean;
  
  // Performance state
  loading: boolean;
  indexing: boolean;
  error: string | null;
}

type UnifiedDataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INDEXING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATA'; payload: { recipes: Recipe[]; tags: Tag[] } }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: SearchResult[] }
  | { type: 'SET_SEARCH_SUGGESTIONS'; payload: string[] }
  | { type: 'SET_SHOW_RESULTS'; payload: boolean }
  | { type: 'SET_SELECTED_RECIPE'; payload: number | null }
  | { type: 'SET_SHOW_RECIPE_DETAIL'; payload: boolean };

interface UnifiedDataContextType extends UnifiedDataState {
  // Search actions
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  getSuggestions: (partialQuery: string) => string[];
  
  // Recipe actions
  selectRecipe: (recipeId: number | null) => void;
  showRecipeDetailView: (show: boolean) => void;
  loadRecipeDetails: (recipeId: number) => Promise<Recipe | null>;
  
  // Data actions
  refreshData: () => Promise<void>;
  
  // Services
  searchService: SearchIndexService;
}

const initialState: UnifiedDataState = {
  recipes: [],
  tags: [],
  searchQuery: '',
  searchResults: [],
  searchSuggestions: [],
  showResults: false,
  selectedRecipeId: null,
  showRecipeDetail: false,
  loading: false,
  indexing: false,
  error: null
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
    
    case 'SET_SHOW_RESULTS':
      return { ...state, showResults: action.payload };
    
    case 'SET_SELECTED_RECIPE':
      return { ...state, selectedRecipeId: action.payload };
    
    case 'SET_SHOW_RECIPE_DETAIL':
      return { ...state, showRecipeDetail: action.payload };
    
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

  // Initialize data and build search index
  const initializeServices = useCallback(async (recipes: Recipe[], tags: Tag[]) => {
    dispatch({ type: 'SET_INDEXING', payload: true });
    
    try {
      // Build search index
      await searchService.buildIndex(recipes, tags);
      
      dispatch({ type: 'SET_INDEXING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  }, [searchService]);

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

  const selectRecipe = useCallback((recipeId: number | null) => {
    dispatch({ type: 'SET_SELECTED_RECIPE', payload: recipeId });
  }, []);

  const showRecipeDetailView = useCallback((show: boolean) => {
    dispatch({ type: 'SET_SHOW_RECIPE_DETAIL', payload: show });
  }, []);

  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // Load data on mount - comprehensive approach with fallbacks
  useEffect(() => {
    console.log('📥 ✅ UnifiedDataContext: useEffect SUCCESSFULLY TRIGGERED!');
    console.log('📥 Services available - searchService:', !!searchService);
    
    // Add a small delay to ensure component is fully mounted
    const initializeWithDelay = setTimeout(() => {
      console.log('📥 Starting delayed initialization...');
      
      const initializeData = async () => {
        try {
          console.log('📥 🚀 Starting data initialization...');
          dispatch({ type: 'SET_LOADING', payload: true });
          
          console.log('📥 Fetching from /api/recipes...');
          const recipesResponse = await fetch('/api/recipes');
          console.log('📥 Recipes response:', recipesResponse.status, recipesResponse.statusText);
          
          console.log('📥 Fetching from /api/tags...');
          const tagsResponse = await fetch('/api/tags');
          console.log('📥 Tags response:', tagsResponse.status, tagsResponse.statusText);
          
          if (!recipesResponse.ok || !tagsResponse.ok) {
            throw new Error(`API Error - Recipes: ${recipesResponse.status}, Tags: ${tagsResponse.status}`);
          }
          
          console.log('📥 Parsing JSON responses...');
          const recipes: Recipe[] = await recipesResponse.json();
          const tags: Tag[] = await tagsResponse.json();
          
          console.log('📥 🎉 SUCCESSFULLY LOADED DATA!');
          console.log('📥 - Recipes:', recipes.length);
          console.log('📥 - Tags:', tags.length);
          if (recipes.length > 0) {
            console.log('📥 - First recipe:', recipes[0].title, 'with', recipes[0].tags?.length || 0, 'tags');
          }
          if (tags.length > 0) {
            console.log('📥 - First tag:', tags[0].name);
          }
          
          // Set the data in state
          console.log('📥 Setting data in Redux state...');
          dispatch({ type: 'SET_DATA', payload: { recipes, tags } });
          dispatch({ type: 'SET_LOADING', payload: false });
          
          // Initialize services
          console.log('📥 Building search index...');
          dispatch({ type: 'SET_INDEXING', payload: true });
          await searchService.buildIndex(recipes, tags);
          console.log('📥 ✅ Search index built');
          
          dispatch({ type: 'SET_INDEXING', payload: false });
          console.log('📥 🎊 COMPLETE SUCCESS - Data initialization finished!');
          
        } catch (error) {
          console.error('📥 💥 CRITICAL ERROR in data initialization:', error);
          console.error('📥 Error message:', error instanceof Error ? error.message : error);
          console.error('📥 Full error:', error);
          dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      };
      
      initializeData();
    }, 100); // 100ms delay to ensure mounting is complete
    
    return () => {
      clearTimeout(initializeWithDelay);
    };
  }, []); // Empty dependency array - run once on mount only

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
    
    // Recipe actions
    selectRecipe,
    showRecipeDetailView,
    loadRecipeDetails,
    
    // Data actions
    refreshData,
    
    // Services
    searchService
  };

  return (
    <UnifiedDataContext.Provider value={contextValue}>
      {children}
    </UnifiedDataContext.Provider>
  );
};

export const useUnifiedData = (): UnifiedDataContextType => {
  console.log('🎯 useUnifiedData: Hook called!');
  const context = useContext(UnifiedDataContext);
  console.log('🎯 useUnifiedData: Context value:', !!context);
  
  if (!context) {
    console.error('🎯 useUnifiedData: ❌ NO CONTEXT - throwing error');
    throw new Error('useUnifiedData must be used within a UnifiedDataProvider');
  }
  
  console.log('🎯 useUnifiedData: ✅ Context found, returning data');
  console.log('🎯 useUnifiedData: - recipes:', context.recipes?.length || 0);
  console.log('🎯 useUnifiedData: - search results:', context.searchResults?.length || 0);
  return context;
};