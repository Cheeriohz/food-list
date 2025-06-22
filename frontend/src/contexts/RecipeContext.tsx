import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Recipe, RecipeContextType } from '../types';

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

interface RecipeState {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  loading: boolean;
  error: string | null;
}

type RecipeAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_RECIPES'; payload: Recipe[] }
  | { type: 'SET_CURRENT_RECIPE'; payload: Recipe }
  | { type: 'ADD_RECIPE'; payload: Recipe }
  | { type: 'UPDATE_RECIPE'; payload: Recipe }
  | { type: 'DELETE_RECIPE'; payload: number };

const initialState: RecipeState = {
  recipes: [],
  currentRecipe: null,
  loading: false,
  error: null
};

const recipeReducer = (state: RecipeState, action: RecipeAction): RecipeState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_RECIPES':
      return { ...state, recipes: action.payload, loading: false };
    case 'SET_CURRENT_RECIPE':
      return { ...state, currentRecipe: action.payload, loading: false };
    case 'ADD_RECIPE':
      return { ...state, recipes: [action.payload, ...state.recipes] };
    case 'UPDATE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.map(recipe =>
          recipe.id === action.payload.id ? action.payload : recipe
        ),
        currentRecipe: action.payload
      };
    case 'DELETE_RECIPE':
      return {
        ...state,
        recipes: state.recipes.filter(recipe => recipe.id !== action.payload),
        currentRecipe: state.currentRecipe?.id === action.payload ? null : state.currentRecipe
      };
    default:
      return state;
  }
};

interface RecipeProviderProps {
  children: ReactNode;
}

export const RecipeProvider = ({ children }: RecipeProviderProps) => {
  const [state, dispatch] = useReducer(recipeReducer, initialState);

  const fetchRecipes = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/recipes');
      if (!response.ok) throw new Error('Failed to fetch recipes');
      const recipes: Recipe[] = await response.json();
      dispatch({ type: 'SET_RECIPES', payload: recipes });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  };

  const fetchRecipe = useCallback(async (id: number): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`/api/recipes/${id}`);
      if (!response.ok) throw new Error('Failed to fetch recipe');
      const recipe: Recipe = await response.json();
      dispatch({ type: 'SET_CURRENT_RECIPE', payload: recipe });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  }, []);

  const createRecipe = async (recipeData: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData)
      });
      if (!response.ok) throw new Error('Failed to create recipe');
      await fetchRecipes();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  };

  const updateRecipe = async (id: number, recipeData: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData)
      });
      if (!response.ok) throw new Error('Failed to update recipe');
      const updatedRecipe: Recipe = await response.json();
      dispatch({ type: 'UPDATE_RECIPE', payload: updatedRecipe });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  };

  const deleteRecipe = async (id: number): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete recipe');
      dispatch({ type: 'DELETE_RECIPE', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  };

  const searchRecipes = async (query: string, tags: string[] = []): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (tags.length > 0) params.append('tags', tags.join(','));
      
      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) throw new Error('Failed to search recipes');
      const recipes: Recipe[] = await response.json();
      dispatch({ type: 'SET_RECIPES', payload: recipes });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  };

  const updateRecipeTags = async (recipeId: number, tagIds: number[]): Promise<void> => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds })
      });
      if (!response.ok) throw new Error('Failed to update recipe tags');
      const updatedRecipe: Recipe = await response.json();
      dispatch({ type: 'UPDATE_RECIPE', payload: updatedRecipe });
      // Also refresh the recipes list to ensure consistency
      await fetchRecipes();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
      throw error;
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const value: RecipeContextType = {
    ...state,
    fetchRecipes,
    fetchRecipe,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    searchRecipes,
    updateRecipeTags
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = (): RecipeContextType => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};