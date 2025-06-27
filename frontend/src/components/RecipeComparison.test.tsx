import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Recipe } from '../types';
import RecipeComparison from './RecipeComparison';

const getMockRecipe = (overrides?: Partial<Recipe>): Recipe => {
  return {
    id: 1,
    title: 'Test Recipe',
    ingredients: 'ingredient1\ningredient2\ningredient3',
    instructions: 'step1\nstep2',
    tags: [
      { id: 1, name: 'vegetarian' },
      { id: 2, name: 'quick' }
    ],
    prep_time: 15,
    cook_time: 30,
    servings: 4,
    description: 'A test recipe',
    created_at: '2024-01-15T12:00:00Z',
    ...overrides
  };
};

describe('RecipeComparison', () => {
  const mockOnClose = vi.fn();
  const mockOnRemoveRecipe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when no recipes are provided', () => {
    it('should not render anything', () => {
      const { container } = render(
        <RecipeComparison
          recipes={[]}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('when recipes are provided', () => {
    const testRecipes = [
      getMockRecipe({ 
        id: 1, 
        title: 'Quick Pasta', 
        prep_time: 10, 
        cook_time: 15,
        servings: 2
      }),
      getMockRecipe({ 
        id: 2, 
        title: 'Slow Roast', 
        prep_time: 30, 
        cook_time: 120,
        servings: 6
      }),
      getMockRecipe({ 
        id: 3, 
        title: 'Simple Salad', 
        prep_time: 5, 
        cook_time: 0,
        servings: 1
      })
    ];

    it('should display comparison modal with recipe count', () => {
      render(
        <RecipeComparison
          recipes={testRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      expect(screen.getByText('Recipe Comparison (3 recipes)')).toBeInTheDocument();
    });

    it('should display all recipe titles', () => {
      render(
        <RecipeComparison
          recipes={testRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      expect(screen.getByText('Quick Pasta')).toBeInTheDocument();
      expect(screen.getByText('Slow Roast')).toBeInTheDocument();
      expect(screen.getByText('Simple Salad')).toBeInTheDocument();
    });

    it('should show default selected metrics', () => {
      render(
        <RecipeComparison
          recipes={testRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      // Default metrics should be visible as column headers
      expect(screen.getAllByText('Prep Time')).toHaveLength(2); // checkbox and header
      expect(screen.getAllByText('Cook Time')).toHaveLength(2);
      expect(screen.getAllByText('Servings')).toHaveLength(2);
      expect(screen.getAllByText('Ingredients Count')).toHaveLength(2);
      expect(screen.getAllByText('Tags')).toHaveLength(2);
    });

    it('should display formatted metric values', () => {
      const recipesWithDifferentData = [
        getMockRecipe({ 
          id: 1, 
          title: 'Quick Pasta', 
          prep_time: 10, 
          cook_time: 15,
          servings: 2,
          ingredients: 'pasta\nsalt'
        }),
        getMockRecipe({ 
          id: 2, 
          title: 'Slow Roast', 
          prep_time: 30, 
          cook_time: 120,
          servings: 6,
          ingredients: 'beef\nvegetables\nspices\nsauce\nherbs'
        }),
      ];

      render(
        <RecipeComparison
          recipes={recipesWithDifferentData}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      // Check formatted time values
      expect(screen.getByText('10 min')).toBeInTheDocument(); // Quick Pasta prep time
      expect(screen.getByText('15 min')).toBeInTheDocument(); // Quick Pasta cook time
      expect(screen.getByText('120 min')).toBeInTheDocument(); // Slow Roast cook time

      // Check servings
      expect(screen.getByText('2')).toBeInTheDocument(); // Quick Pasta servings
      expect(screen.getByText('6')).toBeInTheDocument(); // Slow Roast servings

      // Check ingredients count (different for each recipe)
      expect(screen.getByText('2 ingredients')).toBeInTheDocument(); // Quick Pasta
      expect(screen.getByText('5 ingredients')).toBeInTheDocument(); // Slow Roast
    });

    it('should highlight best and worst values for numeric metrics', () => {
      render(
        <RecipeComparison
          recipes={testRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      // Find cells with best/worst value classes
      const bestCells = document.querySelectorAll('.best-value');
      const worstCells = document.querySelectorAll('.worst-value');

      expect(bestCells.length).toBeGreaterThan(0);
      expect(worstCells.length).toBeGreaterThan(0);
    });

    it('should display complexity scores', () => {
      render(
        <RecipeComparison
          recipes={testRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      // Should have complexity column header
      expect(screen.getByText('Complexity')).toBeInTheDocument();
      
      // All recipes should have complexity scores (Simple, Moderate, or Complex)
      const complexityElements = document.querySelectorAll('.complexity-score .score-label');
      expect(complexityElements.length).toBe(3);
    });

    it('should show statistics for numeric metrics', () => {
      render(
        <RecipeComparison
          recipes={testRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      // Should show min/max/avg statistics for at least one metric
      const statsElements = document.querySelectorAll('.stats-text');
      expect(statsElements.length).toBeGreaterThan(0);
      
      // Check that at least one has the expected format
      const hasStatsText = Array.from(statsElements).some(el => 
        /Min: \d+ \| Max: \d+ \| Avg: \d+/.test(el.textContent || '')
      );
      expect(hasStatsText).toBe(true);
    });
  });

  describe('metric selection', () => {
    const testRecipes = [getMockRecipe(), getMockRecipe({ id: 2, title: 'Recipe 2' })];

    it('should allow toggling metrics on and off', async () => {
      const user = userEvent.setup();
      
      render(
        <RecipeComparison
          recipes={testRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      // Total Time should initially be unchecked and not visible in table
      const tableHeaders = screen.getAllByRole('columnheader');
      const totalTimeInTable = tableHeaders.find(header => header.textContent?.includes('Total Time'));
      expect(totalTimeInTable).toBeUndefined();
      
      // Find and click the Total Time checkbox using a more specific selector
      const totalTimeCheckbox = screen.getByRole('checkbox', { name: /total time/i });
      await user.click(totalTimeCheckbox);

      // Total Time column should now be visible in table
      const updatedTableHeaders = screen.getAllByRole('columnheader');
      const totalTimeInUpdatedTable = updatedTableHeaders.find(header => 
        header.textContent?.includes('Total Time')
      );
      expect(totalTimeInUpdatedTable).toBeDefined();
    });

    it('should persist metric selection state', async () => {
      const user = userEvent.setup();
      
      render(
        <RecipeComparison
          recipes={testRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      // Initially Prep Time should be visible in table
      let tableHeaders = screen.getAllByRole('columnheader');
      let prepTimeInTable = tableHeaders.find(header => header.textContent?.includes('Prep Time'));
      expect(prepTimeInTable).toBeDefined();

      // Toggle off Prep Time
      const prepTimeCheckbox = screen.getByRole('checkbox', { name: /prep time/i });
      await user.click(prepTimeCheckbox);

      // Prep Time column should be hidden from table
      tableHeaders = screen.getAllByRole('columnheader');
      prepTimeInTable = tableHeaders.find(header => header.textContent?.includes('Prep Time'));
      expect(prepTimeInTable).toBeUndefined();

      // Toggle it back on
      await user.click(prepTimeCheckbox);

      // Prep Time column should be visible again in table
      tableHeaders = screen.getAllByRole('columnheader');
      prepTimeInTable = tableHeaders.find(header => header.textContent?.includes('Prep Time'));
      expect(prepTimeInTable).toBeDefined();
    });
  });

  describe('recipe removal', () => {
    const testRecipes = [
      getMockRecipe({ id: 1, title: 'Recipe 1' }),
      getMockRecipe({ id: 2, title: 'Recipe 2' })
    ];

    it('should call onRemoveRecipe when remove button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <RecipeComparison
          recipes={testRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      // Find and click the remove button for first recipe
      const removeButtons = screen.getAllByText('Remove');
      await user.click(removeButtons[0]);

      expect(mockOnRemoveRecipe).toHaveBeenCalledWith('1');
    });

    it('should show remove button for each recipe', () => {
      render(
        <RecipeComparison
          recipes={testRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      const removeButtons = screen.getAllByText('Remove');
      expect(removeButtons).toHaveLength(2);
    });
  });

  describe('modal controls', () => {
    const testRecipes = [getMockRecipe()];

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <RecipeComparison
          recipes={testRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      const closeButton = screen.getByText('✕');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should have close button accessible', () => {
      render(
        <RecipeComparison
          recipes={testRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      // Close button should be present and clickable
      const closeButton = screen.getByText('✕');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.tagName).toBe('BUTTON');
    });
  });

  describe('accessibility', () => {
    const testRecipes = [getMockRecipe()];

    it('should have proper ARIA labels', () => {
      render(
        <RecipeComparison
          recipes={testRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      // Check for proper table structure
      expect(screen.getByRole('table')).toBeInTheDocument();
      
      // Should have column headers (count may vary based on selected metrics)
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders.length).toBeGreaterThan(5); // At least recipe + some metrics + complexity
      
      // Should have header row + recipe rows
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // At least header + 1 recipe
    });

    it('should have keyboard navigation support', () => {
      render(
        <RecipeComparison
          recipes={testRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      // All interactive elements should be focusable
      const interactiveElements = screen.getAllByRole('button');
      interactiveElements.forEach(element => {
        expect(element).not.toHaveAttribute('tabIndex', '-1');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle recipes with missing data gracefully', () => {
      const incompleteRecipes = [
        getMockRecipe({ 
          prep_time: undefined, 
          cook_time: undefined, 
          ingredients: '', 
          instructions: '',
          tags: []
        })
      ];

      render(
        <RecipeComparison
          recipes={incompleteRecipes}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      // Should show appropriate placeholder values for missing data
      expect(screen.getAllByText('Not specified').length).toBeGreaterThan(0);
      expect(screen.getByText('0 ingredients')).toBeInTheDocument();
      expect(screen.getByText('None')).toBeInTheDocument(); // For tags
      
      // Should handle missing numeric values gracefully
      const metricCells = document.querySelectorAll('.metric-cell');
      expect(metricCells.length).toBeGreaterThan(0);
    });

    it('should handle single recipe comparison', () => {
      const singleRecipe = [getMockRecipe()];

      render(
        <RecipeComparison
          recipes={singleRecipe}
          onClose={mockOnClose}
          onRemoveRecipe={mockOnRemoveRecipe}
        />
      );

      expect(screen.getByText('Recipe Comparison (1 recipes)')).toBeInTheDocument();
      // With only one recipe, all values should be both min and max
      const metricCells = document.querySelectorAll('.metric-cell');
      expect(metricCells.length).toBeGreaterThan(0);
    });
  });
});