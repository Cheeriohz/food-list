export interface DbRecipeRow {
  id: number;
  title: string;
  description: string | null;
  ingredients: string;
  instructions: string;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  created_at: string;
  updated_at: string;
  tags: string | null; // JSON string of tags array
}

export interface DbTagRow {
  id: number;
  name: string;
  parent_tag_id: number | null;
  created_at: string;
}

export interface DbTagWithName {
  id: number;
  name: string;
  parent_tag_id: number | null;
}

export interface DbRecipeTagRow {
  recipe_id: number;
  tag_id: number;
}

export interface DatabaseResult {
  lastID: number;
  changes: number;
}

export interface DatabaseRunContext {
  lastID: number;
  changes: number;
}