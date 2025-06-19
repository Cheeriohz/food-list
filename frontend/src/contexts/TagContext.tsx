import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Tag, TagContextType } from '../types';

const TagContext = createContext<TagContextType | undefined>(undefined);

interface TagState {
  tags: Tag[];
  selectedTags: string[];
  loading: boolean;
  error: string | null;
}

type TagAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_TAGS'; payload: Tag[] }
  | { type: 'ADD_TAG'; payload: Tag }
  | { type: 'TOGGLE_TAG_SELECTION'; payload: string }
  | { type: 'CLEAR_SELECTED_TAGS' };

const initialState: TagState = {
  tags: [],
  selectedTags: [],
  loading: false,
  error: null
};

const tagReducer = (state: TagState, action: TagAction): TagState => {
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

interface TagProviderProps {
  children: ReactNode;
}

export const TagProvider = ({ children }: TagProviderProps) => {
  const [state, dispatch] = useReducer(tagReducer, initialState);

  const fetchTags = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      const tags: Tag[] = await response.json();
      dispatch({ type: 'SET_TAGS', payload: tags });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  };

  const createTag = async (tagData: Omit<Tag, 'id' | 'created_at'>): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tagData)
      });
      if (!response.ok) throw new Error('Failed to create tag');
      const newTag: Tag = await response.json();
      dispatch({ type: 'ADD_TAG', payload: newTag });
      await fetchTags();
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    }
  };

  const selectTag = (tagName: string): void => {
    if (!state.selectedTags.includes(tagName)) {
      dispatch({ type: 'TOGGLE_TAG_SELECTION', payload: tagName });
    }
  };

  const deselectTag = (tagName: string): void => {
    if (state.selectedTags.includes(tagName)) {
      dispatch({ type: 'TOGGLE_TAG_SELECTION', payload: tagName });
    }
  };

  const clearSelectedTags = (): void => {
    dispatch({ type: 'CLEAR_SELECTED_TAGS' });
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const value: TagContextType = {
    ...state,
    fetchTags,
    createTag,
    selectTag,
    deselectTag,
    clearSelectedTags
  };

  return (
    <TagContext.Provider value={value}>
      {children}
    </TagContext.Provider>
  );
};

export const useTags = (): TagContextType => {
  const context = useContext(TagContext);
  if (!context) {
    throw new Error('useTags must be used within a TagProvider');
  }
  return context;
};