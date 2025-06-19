import React, { createContext, useContext, useReducer, useEffect } from 'react';

const RecipeContext = createContext();

const initialState = {
  recipes: [],
  currentRecipe: null,
  loading: false,
  error: null
};

const recipeReducer = (state, action) => {
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

export const RecipeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(recipeReducer, initialState);

  const fetchRecipes = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/recipes');
      if (!response.ok) throw new Error('Failed to fetch recipes');
      const recipes = await response.json();
      dispatch({ type: 'SET_RECIPES', payload: recipes });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const fetchRecipe = async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`/api/recipes/${id}`);
      if (!response.ok) throw new Error('Failed to fetch recipe');
      const recipe = await response.json();
      dispatch({ type: 'SET_CURRENT_RECIPE', payload: recipe });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const createRecipe = async (recipeData) => {
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
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const updateRecipe = async (id, recipeData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData)
      });
      if (!response.ok) throw new Error('Failed to update recipe');
      const updatedRecipe = await response.json();
      dispatch({ type: 'UPDATE_RECIPE', payload: updatedRecipe });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const deleteRecipe = async (id) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete recipe');
      dispatch({ type: 'DELETE_RECIPE', payload: id });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const searchRecipes = async (query, tags = []) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (tags.length > 0) params.append('tags', tags.join(','));
      
      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) throw new Error('Failed to search recipes');
      const recipes = await response.json();
      dispatch({ type: 'SET_RECIPES', payload: recipes });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const value = {
    ...state,
    fetchRecipes,
    fetchRecipe,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    searchRecipes
  };

  return (
    <RecipeContext.Provider value={value}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipes = () => {
  const context = useContext(RecipeContext);
  if (!context) {
    throw new Error('useRecipes must be used within a RecipeProvider');
  }
  return context;
};