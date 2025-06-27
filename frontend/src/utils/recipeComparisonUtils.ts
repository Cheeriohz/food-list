import { Recipe } from '../types';

export type ComplexityLevel = 'Simple' | 'Moderate' | 'Complex';

export interface ComplexityScore {
  score: number;
  level: ComplexityLevel;
  color: string;
}

export interface MetricStats {
  min: number;
  max: number;
  avg: number;
}

export type MetricClassification = 'best' | 'worst' | 'normal';

// Pure function to calculate recipe complexity score
export const calculateComplexityScore = (recipe: Recipe): ComplexityScore => {
  const prepTime = recipe.prep_time || 0;
  const cookTime = recipe.cook_time || 0;
  const totalTime = prepTime + cookTime;
  
  const ingredientsCount = recipe.ingredients 
    ? recipe.ingredients.split('\n').filter(i => i.trim()).length 
    : 0;
  
  const stepsCount = recipe.instructions
    ? recipe.instructions.split('\n').filter(i => i.trim()).length
    : 0;

  // Simple complexity score calculation (lower is simpler)
  const score = (totalTime * 0.1) + (ingredientsCount * 2) + (stepsCount * 1.5);
  
  let level: ComplexityLevel;
  let color: string;
  
  if (score < 20) {
    level = 'Simple';
    color = '#4caf50';
  } else if (score < 40) {
    level = 'Moderate';
    color = '#ff9800';
  } else {
    level = 'Complex';
    color = '#f44336';
  }

  return {
    score: Math.round(score * 10) / 10, // Round to 1 decimal place
    level,
    color
  };
};

// Pure function to calculate metric comparison statistics
export const getMetricComparison = (recipes: Recipe[], metricKey: string): MetricStats | null => {
  // Only process numeric metrics
  const numericMetrics = new Set([
    'prep_time', 'cook_time', 'total_time', 'servings', 
    'ingredients_count', 'instructions_count'
  ]);
  
  if (!numericMetrics.has(metricKey)) {
    return null;
  }

  const values = recipes
    .map(recipe => getMetricValue(recipe, metricKey))
    .filter(value => value !== undefined && value !== null && typeof value === 'number')
    .map(value => Number(value));

  if (values.length === 0) {
    return null;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

  return { min, max, avg };
};

// Pure function to classify metric values
export const classifyMetricValue = (
  value: number | string | undefined, 
  stats: MetricStats
): MetricClassification => {
  if (value === undefined || value === null || typeof value !== 'number') {
    return 'normal';
  }

  const numValue = Number(value);
  if (numValue === stats.min) return 'best';
  if (numValue === stats.max) return 'worst';
  return 'normal';
};

// Pure function to extract metric values from recipes
export const getMetricValue = (recipe: Recipe, metricKey: string): string | number | undefined => {
  switch (metricKey) {
    case 'prep_time':
      return recipe.prep_time;
    case 'cook_time':
      return recipe.cook_time;
    case 'total_time': {
      const prep = recipe.prep_time || 0;
      const cook = recipe.cook_time || 0;
      return prep + cook;
    }
    case 'servings':
      return recipe.servings;
    case 'ingredients_count': {
      if (!recipe.ingredients) return 0;
      return recipe.ingredients.split('\n').filter(i => i.trim()).length;
    }
    case 'instructions_count': {
      if (!recipe.instructions) return 0;
      return recipe.instructions.split('\n').filter(i => i.trim()).length;
    }
    case 'tags': {
      return recipe.tags?.map(tag => tag.name).join(', ') || 'None';
    }
    case 'created_at':
      return recipe.created_at;
    case 'title':
      return recipe.title;
    default:
      return undefined;
  }
};

// Pure function to format metric values for display
export const formatMetricValue = (value: string | number | undefined, metricKey: string): string => {
  if (value === undefined || value === null) {
    switch (metricKey) {
      case 'prep_time':
      case 'cook_time':
      case 'total_time':
      case 'servings':
        return 'Not specified';
      case 'created_at':
        return 'Unknown';
      case 'tags':
        return 'None';
      default:
        return 'Not specified';
    }
  }

  switch (metricKey) {
    case 'prep_time':
    case 'cook_time':
    case 'total_time':
      return `${value} min`;
    case 'ingredients_count':
      return `${value} ingredients`;
    case 'instructions_count':
      return `${value} steps`;
    case 'servings':
      return `${value}`;
    case 'created_at':
      return new Date(value as string).toLocaleDateString();
    default:
      return String(value);
  }
};

export interface MetricConfig {
  label: string;
  isNumeric: boolean;
}

// Pure function to get metric configuration
export const getMetricConfig = (): Record<string, MetricConfig> => {
  return {
    prep_time: {
      label: 'Prep Time',
      isNumeric: true
    },
    cook_time: {
      label: 'Cook Time',
      isNumeric: true
    },
    total_time: {
      label: 'Total Time',
      isNumeric: true
    },
    servings: {
      label: 'Servings',
      isNumeric: true
    },
    ingredients_count: {
      label: 'Ingredients Count',
      isNumeric: true
    },
    instructions_count: {
      label: 'Steps Count',
      isNumeric: true
    },
    tags: {
      label: 'Tags',
      isNumeric: false
    },
    created_at: {
      label: 'Created',
      isNumeric: false
    }
  };
};

// Pure function for array toggle operations (immutable)
export const toggleArrayItem = <T>(array: T[], item: T): T[] => {
  return array.includes(item)
    ? array.filter(existingItem => existingItem !== item)
    : [...array, item];
};