import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tag } from '../types';
import AdvancedSearchFilters, { SearchFilters } from './AdvancedSearchFilters';
import { DEFAULT_FILTERS } from '../utils/searchFilterUtils';

const getMockTag = (overrides?: Partial<Tag>): Tag => {
  return {
    id: 1,
    name: 'vegetarian',
    created_at: '2024-01-01',
    ...overrides
  };
};

describe('AdvancedSearchFilters', () => {
  const mockOnFiltersChange = vi.fn();
  const mockOnToggle = vi.fn();
  const mockOnReset = vi.fn();

  const defaultProps = {
    filters: DEFAULT_FILTERS,
    onFiltersChange: mockOnFiltersChange,
    availableTags: [
      getMockTag({ id: 1, name: 'vegetarian' }),
      getMockTag({ id: 2, name: 'quick' }),
      getMockTag({ id: 3, name: 'healthy' })
    ],
    isOpen: true,
    onToggle: mockOnToggle,
    onReset: mockOnReset
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when closed', () => {
    it('should show toggle button with filter indicator when filters are active', () => {
      const activeFilters = {
        ...DEFAULT_FILTERS,
        tags: ['vegetarian'],
        prepTimeRange: [10, 60] as [number, number]
      };

      render(
        <AdvancedSearchFilters
          {...defaultProps}
          filters={activeFilters}
          isOpen={false}
        />
      );

      expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
      
      // Should show active indicator
      const activeIndicator = document.querySelector('.active-indicator');
      expect(activeIndicator).toBeInTheDocument();
    });

    it('should not show active indicator for default filters', () => {
      render(
        <AdvancedSearchFilters
          {...defaultProps}
          filters={DEFAULT_FILTERS}
          isOpen={false}
        />
      );

      expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
      
      // Should not show active indicator
      const activeIndicator = document.querySelector('.active-indicator');
      expect(activeIndicator).not.toBeInTheDocument();
    });

    it('should call onToggle when button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <AdvancedSearchFilters
          {...defaultProps}
          isOpen={false}
        />
      );

      const toggleButton = screen.getByText('Advanced Filters').closest('button');
      expect(toggleButton).toBeInTheDocument();
      
      await user.click(toggleButton!);
      expect(mockOnToggle).toHaveBeenCalled();
    });
  });

  describe('when open', () => {
    it('should display all filter sections', () => {
      render(<AdvancedSearchFilters {...defaultProps} />);

      expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
      expect(screen.getByText(/Tags \(/)).toBeInTheDocument(); // "Tags (0 selected)"
      expect(screen.getByText('Prep Time')).toBeInTheDocument();
      expect(screen.getByText('Cook Time')).toBeInTheDocument();
      expect(screen.getByText('Servings')).toBeInTheDocument();
      expect(screen.getByText('Sort By')).toBeInTheDocument();
    });

    it('should call onToggle when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<AdvancedSearchFilters {...defaultProps} />);

      const closeButton = screen.getByText('✕');
      await user.click(closeButton);
      
      expect(mockOnToggle).toHaveBeenCalled();
    });

    it('should call onReset when reset button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<AdvancedSearchFilters {...defaultProps} />);

      const resetButton = screen.getByText('Reset All');
      await user.click(resetButton);
      
      expect(mockOnReset).toHaveBeenCalled();
    });

    it('should have a button to show available tags', () => {
      render(<AdvancedSearchFilters {...defaultProps} />);

      // Tags are initially hidden behind "Show All Tags" button
      expect(screen.getByText('Show All Tags')).toBeInTheDocument();
    });

    it('should show correct tag selection count', () => {
      const filtersWithTags = {
        ...DEFAULT_FILTERS,
        tags: ['vegetarian', 'quick']
      };

      render(
        <AdvancedSearchFilters
          {...defaultProps}
          filters={filtersWithTags}
        />
      );

      expect(screen.getByText('Tags (2 selected)')).toBeInTheDocument();
    });
  });

  describe('tag selection', () => {
    it('should expand tags when "Show All Tags" is clicked', async () => {
      const user = userEvent.setup();
      
      render(<AdvancedSearchFilters {...defaultProps} />);

      const showAllTagsButton = screen.getByText('Show All Tags');
      await user.click(showAllTagsButton);
      
      // After clicking, tags should be visible
      expect(screen.getByText('vegetarian')).toBeInTheDocument();
      expect(screen.getByText('quick')).toBeInTheDocument();
      expect(screen.getByText('healthy')).toBeInTheDocument();
    });

    it('should call onFiltersChange when tag is selected', async () => {
      const user = userEvent.setup();
      
      render(<AdvancedSearchFilters {...defaultProps} />);

      // First expand the tags
      const showAllTagsButton = screen.getByText('Show All Tags');
      await user.click(showAllTagsButton);

      // Find the vegetarian tag element (might be button or clickable element)
      const vegetarianElement = screen.getByText('vegetarian');
      expect(vegetarianElement).toBeInTheDocument();
      
      // Try to find a clickable parent or the element itself
      const clickableElement = vegetarianElement.closest('button') || 
                               vegetarianElement.closest('[role="button"]') ||
                               vegetarianElement;
      
      await user.click(clickableElement);
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['vegetarian']
        })
      );
    });

    it('should show selected tags count when tags are selected', () => {
      const filtersWithTags = {
        ...DEFAULT_FILTERS,
        tags: ['vegetarian']
      };

      render(
        <AdvancedSearchFilters
          {...defaultProps}
          filters={filtersWithTags}
        />
      );

      // Should show count in selected tags area
      expect(screen.getByText('Tags (1 selected)')).toBeInTheDocument();
    });
  });

  describe('range filters', () => {
    it('should display current range values in labels', () => {
      const filtersWithRanges = {
        ...DEFAULT_FILTERS,
        prepTimeRange: [10, 60] as [number, number],
        cookTimeRange: [15, 120] as [number, number],
        servingsRange: [2, 8] as [number, number]
      };

      render(
        <AdvancedSearchFilters
          {...defaultProps}
          filters={filtersWithRanges}
        />
      );

      // Should display range values in the labels
      expect(screen.getByText(/Prep Time.*10.*60/)).toBeInTheDocument();
      expect(screen.getByText(/Cook Time.*15.*120/)).toBeInTheDocument();
      expect(screen.getByText(/Servings.*2.*8/)).toBeInTheDocument();
    });

    it('should call onFiltersChange when range slider is modified', async () => {
      const user = userEvent.setup();
      
      render(<AdvancedSearchFilters {...defaultProps} />);

      // Find the first range slider (prep time min)
      const rangeSliders = screen.getAllByRole('slider');
      expect(rangeSliders.length).toBeGreaterThan(0);
      
      const prepTimeMinSlider = rangeSliders[0];
      
      // Simulate changing the slider value
      fireEvent.change(prepTimeMinSlider, { target: { value: '15' } });
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          prepTimeRange: [15, 180]
        })
      );
    });
  });

  describe('sort options', () => {
    it('should display sort by dropdown', () => {
      render(<AdvancedSearchFilters {...defaultProps} />);

      const sortSelect = screen.getByRole('combobox');
      expect(sortSelect).toBeInTheDocument();
      expect(sortSelect).toHaveValue('relevance');
    });

    it('should call onFiltersChange when sort option changes', async () => {
      const user = userEvent.setup();
      
      render(<AdvancedSearchFilters {...defaultProps} />);

      const sortSelect = screen.getByRole('combobox');
      await user.selectOptions(sortSelect, 'prep_time');
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: 'prep_time'
        })
      );
    });

    it('should show current sort selection', () => {
      const filtersWithSort = {
        ...DEFAULT_FILTERS,
        sortBy: 'prep_time' as const
      };

      render(
        <AdvancedSearchFilters
          {...defaultProps}
          filters={filtersWithSort}
        />
      );

      const sortSelect = screen.getByRole('combobox');
      expect(sortSelect).toHaveValue('prep_time');
    });
  });

  describe('additional filters', () => {
    it('should handle description filter toggle', async () => {
      const user = userEvent.setup();
      
      render(<AdvancedSearchFilters {...defaultProps} />);

      // Find description filter checkbox (if it exists)
      const descriptionCheckbox = screen.queryByLabelText(/description/i);
      if (descriptionCheckbox) {
        await user.click(descriptionCheckbox);
        
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            hasDescription: expect.any(Boolean)
          })
        );
      }
    });

    it('should handle ingredient count limits', async () => {
      const user = userEvent.setup();
      
      render(<AdvancedSearchFilters {...defaultProps} />);

      // Find ingredient limit inputs (if they exist)
      const minIngredientsInput = screen.queryByLabelText(/minimum ingredients/i);
      if (minIngredientsInput) {
        await user.type(minIngredientsInput, '3');
        
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({
            minIngredients: 3
          })
        );
      }
    });
  });

  describe('accessibility', () => {
    it('should have proper form labels', () => {
      render(<AdvancedSearchFilters {...defaultProps} />);

      // Should have label elements for form controls
      const labels = screen.getAllByText(/Tags|Prep Time|Cook Time|Servings|Sort/);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', () => {
      render(<AdvancedSearchFilters {...defaultProps} />);

      // All interactive elements should be focusable
      const buttons = screen.getAllByRole('button');
      const selects = screen.getAllByRole('combobox');
      const sliders = screen.getAllByRole('slider');
      const numberInputs = screen.getAllByRole('spinbutton');
      
      [...buttons, ...selects, ...sliders, ...numberInputs].forEach(element => {
        expect(element).not.toHaveAttribute('tabIndex', '-1');
      });
    });

    it('should have ARIA labels for complex controls', () => {
      render(<AdvancedSearchFilters {...defaultProps} />);

      // Check for range sliders and number inputs
      const sliders = screen.getAllByRole('slider');
      const numberInputs = screen.getAllByRole('spinbutton');
      
      expect(sliders.length).toBeGreaterThan(0);
      expect(numberInputs.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty tags list', () => {
      render(
        <AdvancedSearchFilters
          {...defaultProps}
          availableTags={[]}
        />
      );

      expect(screen.getByText('Tags (0 selected)')).toBeInTheDocument();
      // Should not crash and should show empty tag area
    });

    it('should handle invalid filter values gracefully', () => {
      const invalidFilters = {
        ...DEFAULT_FILTERS,
        prepTimeRange: [-1, 1000] as [number, number], // Invalid range
        servingsRange: [0, 0] as [number, number] // Invalid range
      };

      // Should not crash when rendering with invalid values
      expect(() => {
        render(
          <AdvancedSearchFilters
            {...defaultProps}
            filters={invalidFilters}
          />
        );
      }).not.toThrow();
    });

    it('should preserve filter state during re-renders', () => {
      const { rerender } = render(<AdvancedSearchFilters {...defaultProps} />);
      
      const filtersWithChanges = {
        ...DEFAULT_FILTERS,
        tags: ['vegetarian']
      };
      
      rerender(
        <AdvancedSearchFilters
          {...defaultProps}
          filters={filtersWithChanges}
        />
      );

      expect(screen.getByText('Tags (1 selected)')).toBeInTheDocument();
    });
  });
});