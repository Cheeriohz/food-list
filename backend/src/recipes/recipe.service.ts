import { db } from '../database';
import { Recipe } from '../types';
import { DbRecipeRow, DbTagWithName, DatabaseRunContext } from '../database/types';

export type RecipeServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

export const getAllRecipes = (): Promise<RecipeServiceResult<Recipe[]>> => {
  return new Promise((resolve) => {
    const query = `
      SELECT r.*, 
             JSON_GROUP_ARRAY(
               JSON_OBJECT('id', t.id, 'name', t.name, 'parent_tag_id', t.parent_tag_id)
             ) as tags
      FROM recipes r
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      LEFT JOIN tags t ON rt.tag_id = t.id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `;
    
    db.all(query, [], (err: Error | null, rows: DbRecipeRow[]) => {
      if (err) {
        resolve({ success: false, error: err.message });
        return;
      }
      
      const recipes: Recipe[] = rows.map(row => ({
        ...row,
        description: row.description ?? undefined,
        prep_time: row.prep_time ?? undefined,
        cook_time: row.cook_time ?? undefined,
        servings: row.servings ?? undefined,
        tags: row.tags ? JSON.parse(row.tags).filter((tag: DbTagWithName) => tag.id !== null) : []
      }));
      
      resolve({ success: true, data: recipes });
    });
  });
};

export const getRecipeById = (id: number): Promise<RecipeServiceResult<Recipe>> => {
  return new Promise((resolve) => {
    const query = `
      SELECT r.*, 
             JSON_GROUP_ARRAY(
               JSON_OBJECT('id', t.id, 'name', t.name, 'parent_tag_id', t.parent_tag_id)
             ) as tags
      FROM recipes r
      LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
      LEFT JOIN tags t ON rt.tag_id = t.id
      WHERE r.id = ?
      GROUP BY r.id
    `;
    
    db.get(query, [id], (err: Error | null, row: DbRecipeRow | undefined) => {
      if (err) {
        resolve({ success: false, error: err.message });
        return;
      }
      
      if (!row) {
        resolve({ success: false, error: 'Recipe not found' });
        return;
      }
      
      const recipe: Recipe = {
        ...row,
        description: row.description ?? undefined,
        prep_time: row.prep_time ?? undefined,
        cook_time: row.cook_time ?? undefined,
        servings: row.servings ?? undefined,
        tags: row.tags ? JSON.parse(row.tags).filter((tag: DbTagWithName) => tag.id !== null) : []
      };
      
      resolve({ success: true, data: recipe });
    });
  });
};

export const createRecipe = (recipeData: Omit<Recipe, 'id'>): Promise<RecipeServiceResult<{ id: number }>> => {
  return new Promise((resolve) => {
    const { title, description, ingredients, instructions, prep_time, cook_time, servings, tags } = recipeData;
    
    const insertRecipe = `
      INSERT INTO recipes (title, description, ingredients, instructions, prep_time, cook_time, servings)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(insertRecipe, [title, description, ingredients, instructions, prep_time, cook_time, servings], function(this: DatabaseRunContext, err: Error | null) {
      if (err) {
        resolve({ success: false, error: err.message });
        return;
      }
      
      const recipeId = this.lastID;
      
      if (tags && tags.length > 0) {
        linkRecipeToTags(recipeId, tags)
          .then((result) => {
            if (result.success) {
              resolve({ success: true, data: { id: recipeId } });
            } else {
              resolve({ success: false, error: result.error });
            }
          });
      } else {
        resolve({ success: true, data: { id: recipeId } });
      }
    });
  });
};

export const updateRecipe = (id: number, recipeData: Omit<Recipe, 'id'>): Promise<RecipeServiceResult<void>> => {
  return new Promise((resolve) => {
    const { title, description, ingredients, instructions, prep_time, cook_time, servings, tags } = recipeData;
    
    const updateQuery = `
      UPDATE recipes 
      SET title = ?, description = ?, ingredients = ?, instructions = ?, prep_time = ?, cook_time = ?, servings = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    db.run(updateQuery, [title, description, ingredients, instructions, prep_time, cook_time, servings, id], function(this: DatabaseRunContext, err: Error | null) {
      if (err) {
        resolve({ success: false, error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        resolve({ success: false, error: 'Recipe not found' });
        return;
      }
      
      if (tags && tags.length > 0) {
        unlinkAllRecipeTags(id)
          .then((unlinkResult) => {
            if (!unlinkResult.success) {
              resolve({ success: false, error: unlinkResult.error });
              return;
            }
            
            linkRecipeToTags(id, tags)
              .then((linkResult) => {
                if (linkResult.success) {
                  resolve({ success: true, data: undefined });
                } else {
                  resolve({ success: false, error: linkResult.error });
                }
              });
          });
      } else {
        resolve({ success: true, data: undefined });
      }
    });
  });
};

export const deleteRecipe = (id: number): Promise<RecipeServiceResult<void>> => {
  return new Promise((resolve) => {
    db.run('DELETE FROM recipes WHERE id = ?', [id], function(this: DatabaseRunContext, err: Error | null) {
      if (err) {
        resolve({ success: false, error: err.message });
        return;
      }
      
      if (this.changes === 0) {
        resolve({ success: false, error: 'Recipe not found' });
        return;
      }
      
      resolve({ success: true, data: undefined });
    });
  });
};

const linkRecipeToTags = (recipeId: number, tagNames: string[]): Promise<RecipeServiceResult<void>> => {
  return new Promise((resolve) => {
    const tagPromises = tagNames.map(tagName => {
      return new Promise<void>((resolveTag, rejectTag) => {
        db.get('SELECT id FROM tags WHERE name = ?', [tagName], (err: Error | null, row: { id: number } | undefined) => {
          if (err) {
            rejectTag(err);
          } else if (row) {
            db.run('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)', [recipeId, row.id], () => resolveTag());
          } else {
            db.run('INSERT INTO tags (name) VALUES (?)', [tagName], function(this: DatabaseRunContext, err: Error | null) {
              if (err) {
                rejectTag(err);
              } else {
                db.run('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)', [recipeId, this.lastID], () => resolveTag());
              }
            });
          }
        });
      });
    });
    
    Promise.all(tagPromises)
      .then(() => resolve({ success: true, data: undefined }))
      .catch(err => resolve({ success: false, error: err.message }));
  });
};

const unlinkAllRecipeTags = (recipeId: number): Promise<RecipeServiceResult<void>> => {
  return new Promise((resolve) => {
    db.run('DELETE FROM recipe_tags WHERE recipe_id = ?', [recipeId], (err: Error | null) => {
      if (err) {
        resolve({ success: false, error: err.message });
        return;
      }
      resolve({ success: true, data: undefined });
    });
  });
};