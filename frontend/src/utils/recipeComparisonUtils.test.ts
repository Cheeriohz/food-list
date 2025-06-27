import { describe, it, expect } from 'vitest';
import { Recipe } from '../types';
import {
  calculateComplexityScore,
  getMetricComparison,
  classifyMetricValue,
  getMetricValue,
  formatMetricValue,
  MetricStats
} from './recipeComparisonUtils';

const getMockRecipe = (overrides?: Partial<Recipe>): Recipe => {
  return {
    id: 1,
    title: 'Test Recipe',
    ingredients: 'ingredient1\ningredient2\ningredient3',
    instructions: 'step1\nstep2',
    tags: [],
    prep_time: 15,
    cook_time: 30,
    servings: 4,
    ...overrides
  };
};

describe('Recipe Comparison Utils', () => {
  describe('calculateComplexityScore', () => {
    it('should calculate simple complexity score for basic recipe', () => {
      const recipe = getMockRecipe({
        prep_time: 10,
        cook_time: 20,
        ingredients: 'salt\npepper',
        instructions: 'mix\ncook'
      });

      const result = calculateComplexityScore(recipe);

      expect(result.score).toBe(10); // (30 * 0.1) + (2 * 2) + (2 * 1.5) = 3 + 4 + 3 = 10
      expect(result.level).toBe('Simple');
      expect(result.color).toBe('#4caf50');
    });

    it('should calculate moderate complexity score', () => {
      const recipe = getMockRecipe({
        prep_time: 20,
        cook_time: 40,
        ingredients: 'ing1\ning2\ning3\ning4\ning5',
        instructions: 'step1\nstep2\nstep3\nstep4'
      });

      const result = calculateComplexityScore(recipe);

      expect(result.score).toBe(22); // (60 * 0.1) + (5 * 2) + (4 * 1.5) = 6 + 10 + 6 = 22
      expect(result.level).toBe('Moderate');
      expect(result.color).toBe('#ff9800');
    });

    it('should calculate complex score for elaborate recipe', () => {
      const recipe = getMockRecipe({
        prep_time: 60,
        cook_time: 120,
        ingredients: Array(20).fill('ingredient').join('\n'),
        instructions: Array(15).fill('step').join('\n')
      });

      const result = calculateComplexityScore(recipe);

      expect(result.score).toBe(80.5); // (180 * 0.1) + (20 * 2) + (15 * 1.5) = 18 + 40 + 22.5 = 80.5
      expect(result.level).toBe('Complex');
      expect(result.color).toBe('#f44336');
    });

    it('should handle missing time values', () => {
      const recipe = getMockRecipe({
        prep_time: undefined,
        cook_time: undefined,
        ingredients: 'salt\npepper',
        instructions: 'mix'
      });

      const result = calculateComplexityScore(recipe);

      expect(result.score).toBe(5.5); // (0 * 0.1) + (2 * 2) + (1 * 1.5) = 0 + 4 + 1.5 = 5.5
      expect(result.level).toBe('Simple');
    });

    it('should handle empty ingredients and instructions', () => {
      const recipe = getMockRecipe({
        prep_time: 15,
        cook_time: 15,
        ingredients: '',
        instructions: ''
      });

      const result = calculateComplexityScore(recipe);

      expect(result.score).toBe(3); // (30 * 0.1) + (0 * 2) + (0 * 1.5) = 3 + 0 + 0 = 3
      expect(result.level).toBe('Simple');
    });
  });

  describe('getMetricComparison', () => {
    it('should calculate statistics for numeric metrics', () => {
      const recipes = [
        getMockRecipe({ prep_time: 10 }),
        getMockRecipe({ prep_time: 20 }),
        getMockRecipe({ prep_time: 30 })
      ];

      const result = getMetricComparison(recipes, 'prep_time');

      expect(result).toEqual({
        min: 10,
        max: 30,
        avg: 20
      });
    });

    it('should handle recipes with missing values', () => {
      const recipes = [
        getMockRecipe({ prep_time: 10 }),
        getMockRecipe({ prep_time: undefined }),
        getMockRecipe({ prep_time: 20 })
      ];

      const result = getMetricComparison(recipes, 'prep_time');

      expect(result).toEqual({
        min: 10,
        max: 20,
        avg: 15
      });
    });

    it('should return null for non-numeric metrics', () => {
      const recipes = [getMockRecipe(), getMockRecipe()];

      const result = getMetricComparison(recipes, 'title');

      expect(result).toBeNull();
    });

    it('should return null when no valid values exist', () => {
      const recipes = [
        getMockRecipe({ prep_time: undefined }),
        getMockRecipe({ prep_time: undefined })
      ];

      const result = getMetricComparison(recipes, 'prep_time');

      expect(result).toBeNull();
    });
  });

  describe('classifyMetricValue', () => {
    const stats: MetricStats = { min: 10, max: 30, avg: 20 };

    it('should classify minimum value as best', () => {
      const result = classifyMetricValue(10, stats);
      expect(result).toBe('best');
    });

    it('should classify maximum value as worst', () => {
      const result = classifyMetricValue(30, stats);
      expect(result).toBe('worst');
    });

    it('should classify average value as normal', () => {
      const result = classifyMetricValue(20, stats);
      expect(result).toBe('normal');
    });

    it('should classify undefined as normal', () => {
      const result = classifyMetricValue(undefined, stats);
      expect(result).toBe('normal');
    });
  });

  describe('getMetricValue', () => {
    it('should get basic recipe properties', () => {
      const recipe = getMockRecipe({ prep_time: 15 });
      
      expect(getMetricValue(recipe, 'prep_time')).toBe(15);
      expect(getMetricValue(recipe, 'title')).toBe('Test Recipe');
    });

    it('should calculate total time from prep and cook time', () => {
      const recipe = getMockRecipe({ prep_time: 15, cook_time: 30 });
      
      expect(getMetricValue(recipe, 'total_time')).toBe(45);
    });

    it('should count ingredients correctly', () => {
      const recipe = getMockRecipe({
        ingredients: 'salt\npepper\n\noil\n  \ngarlic'
      });
      
      expect(getMetricValue(recipe, 'ingredients_count')).toBe(4);
    });

    it('should count instructions correctly', () => {
      const recipe = getMockRecipe({
        instructions: 'mix\ncook\n\nserve\n  '
      });
      
      expect(getMetricValue(recipe, 'instructions_count')).toBe(3);
    });

    it('should format tags as comma-separated string', () => {
      const recipe = getMockRecipe({
        tags: [
          { id: 1, name: 'vegetarian' },
          { id: 2, name: 'quick' }
        ]
      });
      
      expect(getMetricValue(recipe, 'tags')).toBe('vegetarian, quick');
    });

    it('should handle empty tags', () => {
      const recipe = getMockRecipe({ tags: [] });
      
      expect(getMetricValue(recipe, 'tags')).toBe('None');
    });
  });

  describe('formatMetricValue', () => {
    it('should format time values with units', () => {
      expect(formatMetricValue(30, 'prep_time')).toBe('30 min');
      expect(formatMetricValue(undefined, 'prep_time')).toBe('Not specified');
    });

    it('should format count values with labels', () => {
      expect(formatMetricValue(5, 'ingredients_count')).toBe('5 ingredients');
      expect(formatMetricValue(3, 'instructions_count')).toBe('3 steps');
    });

    it('should format servings as plain number', () => {
      expect(formatMetricValue(4, 'servings')).toBe('4');
      expect(formatMetricValue(undefined, 'servings')).toBe('Not specified');
    });

    it('should format dates correctly', () => {
      const date = '2024-01-15T12:00:00Z';
      const formatted = formatMetricValue(date, 'created_at');
      // Accept either timezone interpretation as both are valid
      expect(['1/15/2024', '1/14/2024']).toContain(formatted);
      expect(formatMetricValue(undefined, 'created_at')).toBe('Unknown');
    });

    it('should format tags and other strings as-is', () => {
      expect(formatMetricValue('vegetarian, quick', 'tags')).toBe('vegetarian, quick');
      expect(formatMetricValue(undefined, 'tags')).toBe('None');
    });
  });
});