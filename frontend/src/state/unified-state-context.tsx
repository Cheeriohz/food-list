import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { Recipe, Tag } from '../types';
import { SearchResult } from '../services/SearchIndexService';

// Define the unified state shape
interface UnifiedState {
  // Core data
  recipes: Recipe[];
  tags: Tag[];
  
  // Search state
  searchQuery: string;
  searchResults: SearchResult[];
  showResults: boolean;
  
  // Tag selection state
  selectedTags: string[];
  
  // UI state
  selectedRecipeId: number | null;
  
  // Loading and error states
  loading: boolean;
  error: string | null;
}

// Define actions for the reducer
type UnifiedAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RECIPES'; payload: Recipe[] }
  | { type: 'SET_TAGS'; payload: Tag[] }
  | { type: 'ADD_RECIPE'; payload: Recipe }
  | { type: 'UPDATE_RECIPE'; payload: Recipe }
  | { type: 'DELETE_RECIPE'; payload: number }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SEARCH_RESULTS'; payload: SearchResult[] }
  | { type: 'TOGGLE_TAG_SELECTION'; payload: string }
  | { type: 'CLEAR_SELECTED_TAGS' }
  | { type: 'SET_SHOW_RESULTS'; payload: boolean }
  | { type: 'SET_SELECTED_RECIPE'; payload: number | null };

// Define the context interface
interface UnifiedStateContextType extends UnifiedState {
  // Recipe operations
  loadRecipes: () => Promise<void>;
  createRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
  updateRecipe: (id: number, recipe: Recipe) => Promise<void>;
  deleteRecipe: (id: number) => Promise<void>;
  setRecipes: (recipes: Recipe[]) => void;
  
  // Tag operations
  loadTags: () => Promise<void>;
  createTag: (tag: Omit<Tag, 'id'>) => Promise<void>;
  deleteTag: (id: number) => Promise<{ affectedRecipes: unknown[]; promotedChildren: unknown[] }>;
  getTagRecipes: (id: number) => Promise<unknown[]>;
  
  // Tag selection operations
  selectTag: (tagName: string) => void;
  deselectTag: (tagName: string) => void;
  clearSelectedTags: () => void;
  
  // Search operations
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  
  // UI operations
  selectRecipe: (id: number | null) => void;
}

// Initial state
const initialState: UnifiedState = {
  recipes: [],
  tags: [],
  searchQuery: '',
  searchResults: [],
  showResults: false,
  selectedTags: [],
  selectedRecipeId: null,
  loading: false,
  error: null,
};

// Reducer function implementing immutable updates
const unifiedReducer = (state: UnifiedState, action: UnifiedAction): UnifiedState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
      
    case 'SET_RECIPES':
      return { ...state, recipes: action.payload, loading: false, error: null };
      
    case 'SET_TAGS':
      return { ...state, tags: action.payload, loading: false, error: null };
      
    case 'ADD_RECIPE':
      return { 
        ...state, 
        recipes: [action.payload, ...state.recipes],
        loading: false,
        error: null 
      };
      
    case 'UPDATE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.map(recipe =>
          recipe.id === action.payload.id ? action.payload : recipe
        ),
        loading: false,
        error: null
      };
      
    case 'DELETE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.filter(recipe => recipe.id !== action.payload),
        selectedRecipeId: state.selectedRecipeId === action.payload ? null : state.selectedRecipeId,
        loading: false,
        error: null
      };
      
    case 'SET_SEARCH_QUERY':
      return { 
        ...state, 
        searchQuery: action.payload,
        showResults: action.payload.length > 0
      };
      
    case 'SET_SEARCH_RESULTS':
      return { ...state, searchResults: action.payload };
      
    case 'SET_SHOW_RESULTS':
      return { ...state, showResults: action.payload };
      
    case 'SET_SELECTED_RECIPE':
      return { ...state, selectedRecipeId: action.payload };
      
    case 'TOGGLE_TAG_SELECTION':
      const tagName = action.payload;
      const isSelected = state.selectedTags.includes(tagName);
      return {
        ...state,
        selectedTags: isSelected
          ? state.selectedTags.filter(tag => tag !== tagName)
          : [...state.selectedTags, tagName]
      };
      
    case 'CLEAR_SELECTED_TAGS':
      return { ...state, selectedTags: [] };
      
    default:
      return state;
  }
};

// Create the context
const UnifiedStateContext = createContext<UnifiedStateContextType | undefined>(undefined);

// Provider component
export const UnifiedStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(unifiedReducer, initialState);

  // Recipe operations
  const loadRecipes = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/recipes');
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      const recipes = await response.json();
      dispatch({ type: 'SET_RECIPES', payload: recipes });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load recipes' });
    }
  }, []);

  const createRecipe = useCallback(async (recipe: Omit<Recipe, 'id'>): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe),
      });
      if (!response.ok) {
        throw new Error('Failed to create recipe');
      }
      const result = await response.json();
      const newRecipe = { ...recipe, id: result.id };
      dispatch({ type: 'ADD_RECIPE', payload: newRecipe as Recipe });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create recipe' });
    }
  }, []);

  const updateRecipe = useCallback(async (id: number, recipe: Recipe): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe),
      });
      if (!response.ok) {
        throw new Error('Failed to update recipe');
      }
      dispatch({ type: 'UPDATE_RECIPE', payload: recipe });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update recipe' });
    }
  }, []);

  const deleteRecipe = useCallback(async (id: number): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }
      dispatch({ type: 'DELETE_RECIPE', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete recipe' });
    }
  }, []);

  const setRecipes = useCallback((recipes: Recipe[]): void => {
    dispatch({ type: 'SET_RECIPES', payload: recipes });
  }, []);

  // Tag operations
  const loadTags = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) {
        throw new Error('Failed to fetch tags');
      }
      const tags = await response.json();
      dispatch({ type: 'SET_TAGS', payload: tags });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load tags' });
    }
  }, []);

  const createTag = useCallback(async (tag: Omit<Tag, 'id'>): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tag),
      });
      if (!response.ok) {
        throw new Error('Failed to create tag');
      }
      // Reload tags to get the updated list
      await loadTags();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create tag' });
    }
  }, [loadTags]);

  const deleteTag = useCallback(async (id: number): Promise<{ affectedRecipes: unknown[]; promotedChildren: unknown[] }> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete tag');
      }
      const result = await response.json();
      await loadTags();
      return result.details;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete tag' });
      throw error;
    }
  }, [loadTags]);

  const getTagRecipes = useCallback(async (id: number): Promise<unknown[]> => {
    try {
      const response = await fetch(`/api/tags/${id}/recipes`);
      if (!response.ok) {
        throw new Error('Failed to fetch tag recipes');
      }
      return await response.json();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch tag recipes' });
      throw error;
    }
  }, []);

  // Search operations
  const setSearchQuery = useCallback((query: string): void => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const clearSearch = useCallback((): void => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
    dispatch({ type: 'SET_SEARCH_RESULTS', payload: [] });
    dispatch({ type: 'SET_SHOW_RESULTS', payload: false });
  }, []);

  // Tag selection operations
  const selectTag = useCallback((tagName: string): void => {
    dispatch({ type: 'TOGGLE_TAG_SELECTION', payload: tagName });
  }, []);

  const deselectTag = useCallback((tagName: string): void => {
    dispatch({ type: 'TOGGLE_TAG_SELECTION', payload: tagName });
  }, []);

  const clearSelectedTags = useCallback((): void => {
    dispatch({ type: 'CLEAR_SELECTED_TAGS' });
  }, []);

  // UI operations
  const selectRecipe = useCallback((id: number | null): void => {
    dispatch({ type: 'SET_SELECTED_RECIPE', payload: id });
  }, []);

  const contextValue: UnifiedStateContextType = {
    ...state,
    loadRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    setRecipes,
    loadTags,
    createTag,
    deleteTag,
    getTagRecipes,
    selectTag,
    deselectTag,
    clearSelectedTags,
    setSearchQuery,
    clearSearch,
    selectRecipe,
  };

  return (
    <UnifiedStateContext.Provider value={contextValue}>
      {children}
    </UnifiedStateContext.Provider>
  );
};

// Custom hook to use the unified state
export const useUnifiedState = (): UnifiedStateContextType => {
  const context = useContext(UnifiedStateContext);
  if (context === undefined) {
    throw new Error('useUnifiedState must be used within a UnifiedStateProvider');
  }
  return context;
};