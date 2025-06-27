import { describe, it, expect } from 'vitest';
import { hasActiveFilters, resetFilters, isDefaultTimeRange, isDefaultServingsRange } from './searchFilterUtils';

import { SearchFilters, DEFAULT_FILTERS } from './searchFilterUtils';

const getDefaultFilters = (overrides?: Partial<SearchFilters>): SearchFilters => {
  return {
    ...DEFAULT_FILTERS,
    ...overrides
  };
};

describe('Search Filter Utils', () => {
  describe('hasActiveFilters', () => {
    it('should return false for default filters', () => {
      const filters = getDefaultFilters();
      
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when tags are selected', () => {
      const filters = getDefaultFilters({
        tags: ['vegetarian']
      });
      
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when prep time range is modified', () => {
      const filters = getDefaultFilters({
        prepTimeRange: [10, 180]
      });
      
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when cook time range is modified', () => {
      const filters = getDefaultFilters({
        cookTimeRange: [0, 120]
      });
      
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when servings range is modified', () => {
      const filters = getDefaultFilters({
        servingsRange: [2, 12]
      });
      
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when sort order is changed', () => {
      const filters = getDefaultFilters({
        sortBy: 'newest'
      });
      
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when description filter is set', () => {
      const filters = getDefaultFilters({
        hasDescription: true
      });
      
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when ingredient limits are set', () => {
      const filters = getDefaultFilters({
        minIngredients: 3
      });
      
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true for multiple active filters', () => {
      const filters = getDefaultFilters({
        tags: ['vegetarian', 'quick'],
        prepTimeRange: [5, 30],
        sortBy: 'newest'
      });
      
      expect(hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('resetFilters', () => {
    it('should reset all filters to default values', () => {
      const activeFilters = getDefaultFilters({
        tags: ['vegetarian', 'quick'],
        prepTimeRange: [10, 60],
        cookTimeRange: [15, 120],
        servingsRange: [2, 6],
        sortBy: 'newest',
        hasDescription: true,
        minIngredients: 3,
        maxIngredients: 10
      });

      const result = resetFilters(activeFilters);

      expect(result).toEqual(getDefaultFilters());
    });

    it('should return new object (immutable)', () => {
      const originalFilters = getDefaultFilters({ tags: ['vegetarian'] });
      const result = resetFilters(originalFilters);

      expect(result).not.toBe(originalFilters);
      expect(originalFilters.tags).toEqual(['vegetarian']); // Original unchanged
    });
  });

  describe('isDefaultTimeRange', () => {
    it('should return true for default prep time range', () => {
      expect(isDefaultTimeRange([0, 180], 'prep')).toBe(true);
    });

    it('should return true for default cook time range', () => {
      expect(isDefaultTimeRange([0, 240], 'cook')).toBe(true);
    });

    it('should return false for modified ranges', () => {
      expect(isDefaultTimeRange([10, 180], 'prep')).toBe(false);
      expect(isDefaultTimeRange([0, 120], 'cook')).toBe(false);
    });
  });

  describe('isDefaultServingsRange', () => {
    it('should return true for default servings range', () => {
      expect(isDefaultServingsRange([1, 12])).toBe(true);
    });

    it('should return false for modified servings range', () => {
      expect(isDefaultServingsRange([2, 12])).toBe(false);
      expect(isDefaultServingsRange([1, 8])).toBe(false);
    });
  });
});