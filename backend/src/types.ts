export interface Recipe {
  id?: number;
  title: string;
  description?: string;
  ingredients: string;
  instructions: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
}

export interface Tag {
  id?: number;
  name: string;
  parent_tag_id?: number | null;
  created_at?: string;
  children?: Tag[];
}

export interface RecipeTag {
  recipe_id: number;
  tag_id: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface SearchParams {
  q?: string;
  tags?: string;
}