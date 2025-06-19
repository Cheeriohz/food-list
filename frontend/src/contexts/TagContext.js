import React, { createContext, useContext, useReducer, useEffect } from 'react';

const TagContext = createContext();

const initialState = {
  tags: [],
  selectedTags: [],
  loading: false,
  error: null
};

const tagReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_TAGS':
      return { ...state, tags: action.payload, loading: false };
    case 'ADD_TAG':
      return { ...state, tags: [...state.tags, action.payload] };
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

export const TagProvider = ({ children }) => {
  const [state, dispatch] = useReducer(tagReducer, initialState);

  const fetchTags = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      const tags = await response.json();
      dispatch({ type: 'SET_TAGS', payload: tags });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const createTag = async (tagData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagData)
      });
      if (!response.ok) throw new Error('Failed to create tag');
      const newTag = await response.json();
      dispatch({ type: 'ADD_TAG', payload: newTag });
      await fetchTags();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const toggleTagSelection = (tagName) => {
    dispatch({ type: 'TOGGLE_TAG_SELECTION', payload: tagName });
  };

  const clearSelectedTags = () => {
    dispatch({ type: 'CLEAR_SELECTED_TAGS' });
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const value = {
    ...state,
    fetchTags,
    createTag,
    toggleTagSelection,
    clearSelectedTags
  };

  return (
    <TagContext.Provider value={value}>
      {children}
    </TagContext.Provider>
  );
};

export const useTags = () => {
  const context = useContext(TagContext);
  if (!context) {
    throw new Error('useTags must be used within a TagProvider');
  }
  return context;
};