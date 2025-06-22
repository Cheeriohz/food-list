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

export interface RecipeContextType {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  loading: boolean;
  error: string | null;
  fetchRecipes: () => Promise<void>;
  fetchRecipe: (id: number) => Promise<void>;
  createRecipe: (recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateRecipe: (id: number, recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteRecipe: (id: number) => Promise<void>;
  searchRecipes: (query: string, tags: string[]) => Promise<void>;
}

export interface TagContextType {
  tags: Tag[];
  selectedTags: string[];
  loading: boolean;
  error: string | null;
  fetchTags: () => Promise<void>;
  createTag: (tag: Omit<Tag, 'id' | 'created_at'>) => Promise<void>;
  deleteTag: (id: number) => Promise<{ affectedRecipes: any[]; promotedChildren: any[] }>;
  getTagRecipes: (id: number) => Promise<any[]>;
  selectTag: (tagName: string) => void;
  deselectTag: (tagName: string) => void;
  clearSelectedTags: () => void;
}

export interface SearchParams {
  q?: string;
  tags?: string;
}