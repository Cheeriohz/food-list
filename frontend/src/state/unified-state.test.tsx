import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { useUnifiedState, UnifiedStateProvider } from './unified-state-context';
import { Recipe } from '../types';

// Mock fetch to avoid real API calls in tests
globalThis.fetch = vi.fn();

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <UnifiedStateProvider>{children}</UnifiedStateProvider>
  );
};

describe('Unified State Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty recipes and tags', () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUnifiedState(), { wrapper });

    expect(result.current.recipes).toEqual([]);
    expect(result.current.tags).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.searchQuery).toBe('');
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.selectedTags).toEqual([]);
  });

  it('should handle loading states properly', async () => {
    const mockRecipes: Recipe[] = [
      {
        id: 1,
        title: 'Test Recipe',
        ingredients: 'Test ingredients',
        instructions: 'Test instructions',
        tags: []
      }
    ];

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRecipes
    });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUnifiedState(), { wrapper });

    await act(async () => {
      await result.current.loadRecipes();
    });

    expect(result.current.recipes).toEqual(mockRecipes);
    expect(result.current.loading).toBe(false);
  });

  it('should provide unified CRUD operations for recipes', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUnifiedState(), { wrapper });

    const newRecipe = {
      title: 'New Recipe',
      ingredients: 'New ingredients',
      instructions: 'New instructions',
      tags: []
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, message: 'Recipe created successfully' })
    });

    await act(async () => {
      await result.current.createRecipe(newRecipe);
    });

    // Should have called fetch with correct method and data
    expect(fetch).toHaveBeenCalledWith('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecipe)
    });
  });

  it('should handle search functionality without duplication', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUnifiedState(), { wrapper });

    await act(async () => {
      result.current.setSearchQuery('test query');
    });

    expect(result.current.searchQuery).toBe('test query');
    expect(result.current.showResults).toBe(true);
  });

  it('should manage error states consistently', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUnifiedState(), { wrapper });

    await act(async () => {
      await result.current.loadRecipes();
    });

    expect(result.current.error).toBe('Failed to load recipes');
    expect(result.current.loading).toBe(false);
  });

  it('should update recipes immutably', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUnifiedState(), { wrapper });

    const initialRecipes: Recipe[] = [
      { id: 1, title: 'Recipe 1', ingredients: 'ing1', instructions: 'inst1', tags: [] },
      { id: 2, title: 'Recipe 2', ingredients: 'ing2', instructions: 'inst2', tags: [] }
    ];

    // Set initial recipes
    await act(async () => {
      result.current.setRecipes(initialRecipes);
    });

    const updatedRecipe = { ...initialRecipes[0], title: 'Updated Recipe 1' };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Recipe updated successfully' })
    });

    await act(async () => {
      await result.current.updateRecipe(1, updatedRecipe);
    });

    // Check that the original array wasn't mutated
    expect(initialRecipes[0].title).toBe('Recipe 1');
    // Check that the state was updated correctly
    expect(result.current.recipes[0].title).toBe('Updated Recipe 1');
    expect(result.current.recipes[1]).toBe(initialRecipes[1]); // Other recipes unchanged
  });

  it('should handle tag selection immutably', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useUnifiedState(), { wrapper });

    // Initially no tags selected
    expect(result.current.selectedTags).toEqual([]);

    // Select a tag
    await act(async () => {
      result.current.selectTag('vegetarian');
    });

    expect(result.current.selectedTags).toEqual(['vegetarian']);

    // Select another tag
    await act(async () => {
      result.current.selectTag('quick');
    });

    expect(result.current.selectedTags).toEqual(['vegetarian', 'quick']);

    // Deselect a tag
    await act(async () => {
      result.current.deselectTag('vegetarian');
    });

    expect(result.current.selectedTags).toEqual(['quick']);

    // Clear all selected tags
    await act(async () => {
      result.current.clearSelectedTags();
    });

    expect(result.current.selectedTags).toEqual([]);
  });
});