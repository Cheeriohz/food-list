// Pure functions for search filter operations

// Define the SearchFilters interface
export interface SearchFilters {
  tags: string[];
  prepTimeRange: [number, number];
  cookTimeRange: [number, number];
  servingsRange: [number, number];
  sortBy: 'relevance' | 'title' | 'prep_time' | 'cook_time' | 'total_time' | 'servings' | 'created_at';
  sortOrder: 'asc' | 'desc';
  hasDescription: boolean | null;
  minIngredients: number | null;
  maxIngredients: number | null;
}

// Default filter values
export const DEFAULT_FILTERS: SearchFilters = {
  tags: [],
  prepTimeRange: [0, 180],
  cookTimeRange: [0, 240],
  servingsRange: [1, 12],
  sortBy: 'relevance',
  sortOrder: 'desc',
  hasDescription: null,
  minIngredients: null,
  maxIngredients: null
};

// Pure function to check if any filters are active (non-default)
export const hasActiveFilters = (filters: SearchFilters): boolean => {
  return (
    filters.tags.length > 0 ||
    !isDefaultTimeRange(filters.prepTimeRange, 'prep') ||
    !isDefaultTimeRange(filters.cookTimeRange, 'cook') ||
    !isDefaultServingsRange(filters.servingsRange) ||
    filters.sortBy !== DEFAULT_FILTERS.sortBy ||
    filters.sortOrder !== DEFAULT_FILTERS.sortOrder ||
    filters.hasDescription !== null ||
    filters.minIngredients !== null ||
    filters.maxIngredients !== null
  );
};

// Pure function to reset filters to default values
export const resetFilters = (currentFilters: SearchFilters): SearchFilters => {
  return { ...DEFAULT_FILTERS };
};

// Pure function to check if time range is at default
export const isDefaultTimeRange = (
  range: [number, number], 
  type: 'prep' | 'cook'
): boolean => {
  const defaultRange = type === 'prep' 
    ? DEFAULT_FILTERS.prepTimeRange 
    : DEFAULT_FILTERS.cookTimeRange;
  
  return range[0] === defaultRange[0] && range[1] === defaultRange[1];
};

// Pure function to check if servings range is at default
export const isDefaultServingsRange = (range: [number, number]): boolean => {
  return range[0] === DEFAULT_FILTERS.servingsRange[0] && 
         range[1] === DEFAULT_FILTERS.servingsRange[1];
};

// Pure function to update filter tags immutably
export const toggleFilterTag = (filters: SearchFilters, tagName: string): SearchFilters => {
  const newTags = filters.tags.includes(tagName)
    ? filters.tags.filter(tag => tag !== tagName)
    : [...filters.tags, tagName];
  
  return {
    ...filters,
    tags: newTags
  };
};

// Pure function to update time range immutably
export const updateTimeRange = (
  filters: SearchFilters,
  type: 'prep' | 'cook',
  range: [number, number]
): SearchFilters => {
  return {
    ...filters,
    [type === 'prep' ? 'prepTimeRange' : 'cookTimeRange']: range
  };
};

// Pure function to update servings range immutably
export const updateServingsRange = (
  filters: SearchFilters,
  range: [number, number]
): SearchFilters => {
  return {
    ...filters,
    servingsRange: range
  };
};

// Pure function to update sort order immutably
export const updateSortBy = (filters: SearchFilters, sortBy: SearchFilters['sortBy']): SearchFilters => {
  return {
    ...filters,
    sortBy
  };
};

// Pure function to update sort order immutably
export const updateSortOrder = (filters: SearchFilters, sortOrder: SearchFilters['sortOrder']): SearchFilters => {
  return {
    ...filters,
    sortOrder
  };
};

// Pure function to update description filter immutably
export const updateDescriptionFilter = (
  filters: SearchFilters,
  hasDescription: boolean | null
): SearchFilters => {
  return {
    ...filters,
    hasDescription
  };
};

// Pure function to update ingredient limits immutably
export const updateIngredientLimits = (
  filters: SearchFilters,
  minIngredients: number | null,
  maxIngredients: number | null
): SearchFilters => {
  return {
    ...filters,
    minIngredients,
    maxIngredients
  };
};

// Pure function to count active filter criteria
export const getActiveFilterCount = (filters: SearchFilters): number => {
  let count = 0;
  
  if (filters.tags.length > 0) count++;
  if (!isDefaultTimeRange(filters.prepTimeRange, 'prep')) count++;
  if (!isDefaultTimeRange(filters.cookTimeRange, 'cook')) count++;
  if (!isDefaultServingsRange(filters.servingsRange)) count++;
  if (filters.sortBy !== DEFAULT_FILTERS.sortBy) count++;
  if (filters.sortOrder !== DEFAULT_FILTERS.sortOrder) count++;
  if (filters.hasDescription !== null) count++;
  if (filters.minIngredients !== null || filters.maxIngredients !== null) count++;
  
  return count;
};

// Pure function to validate filter values
export const validateFilters = (filters: SearchFilters): string[] => {
  const errors: string[] = [];
  
  // Validate time ranges
  if (filters.prepTimeRange[0] < 0 || filters.prepTimeRange[1] < filters.prepTimeRange[0]) {
    errors.push('Invalid prep time range');
  }
  
  if (filters.cookTimeRange[0] < 0 || filters.cookTimeRange[1] < filters.cookTimeRange[0]) {
    errors.push('Invalid cook time range');
  }
  
  // Validate servings range
  if (filters.servingsRange[0] < 1 || filters.servingsRange[1] < filters.servingsRange[0]) {
    errors.push('Invalid servings range');
  }
  
  // Validate ingredient limits
  if (filters.minIngredients !== null && filters.minIngredients < 1) {
    errors.push('Minimum ingredients must be at least 1');
  }
  
  if (filters.maxIngredients !== null && filters.maxIngredients < 1) {
    errors.push('Maximum ingredients must be at least 1');
  }
  
  if (filters.minIngredients !== null && 
      filters.maxIngredients !== null && 
      filters.minIngredients > filters.maxIngredients) {
    errors.push('Minimum ingredients cannot be greater than maximum');
  }
  
  return errors;
};