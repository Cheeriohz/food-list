import express, { Request, Response } from 'express';
import cors from 'cors';
import { db, initializeDatabase } from './database';
import { Recipe, Tag, SearchParams } from './types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface DbRecipeRow extends Omit<Recipe, 'tags'> {
  tags: string | null;
}

interface DbTagRow {
  id: number;
  name: string;
  parent_tag_id: number | null;
}

app.get('/api/recipes', (_req: Request, res: Response) => {
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
  
  db.all(query, [], (err: Error | null, rows: any[]) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const recipes: Recipe[] = rows.map(row => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags).filter((tag: any) => tag.id !== null) : []
    }));
    
    return res.json(recipes);
  });
});

app.get('/api/recipes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
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
  
  db.get(query, [id], (err: Error | null, row: any) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    const recipe: Recipe = {
      ...row,
      tags: row.tags ? JSON.parse(row.tags).filter((tag: any) => tag.id !== null) : []
    };
    
    return res.json(recipe);
  });
});

app.post('/api/recipes', (req: any, res: any) => {
  const { title, description, ingredients, instructions, prep_time, cook_time, servings, tags }: Recipe = req.body;
  
  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Title, ingredients, and instructions are required' });
  }
  
  const insertRecipe = `
    INSERT INTO recipes (title, description, ingredients, instructions, prep_time, cook_time, servings)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(insertRecipe, [title, description, ingredients, instructions, prep_time, cook_time, servings], function(this: any, err: Error | null) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const recipeId = this.lastID;
    
    if (tags && tags.length > 0) {
      const tagPromises = tags.map(tagName => {
        return new Promise<void>((resolve, reject) => {
          db.get('SELECT id FROM tags WHERE name = ?', [tagName], (err: Error | null, row: { id: number } | undefined) => {
            if (err) {
              reject(err);
            } else if (row) {
              db.run('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)', [recipeId, row.id], () => resolve());
            } else {
              db.run('INSERT INTO tags (name) VALUES (?)', [tagName], function(this: any, err: Error | null) {
                if (err) {
                  reject(err);
                } else {
                  db.run('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)', [recipeId, this.lastID], () => resolve());
                }
              });
            }
          });
        });
      });
      
      Promise.all(tagPromises)
        .then(() => res.status(201).json({ id: recipeId, message: 'Recipe created successfully' }))
        .catch(err => res.status(500).json({ error: err.message }));
    } else {
      res.status(201).json({ id: recipeId, message: 'Recipe created successfully' });
    }
  });
});

app.put('/api/recipes/:id', (req: any, res: any) => {
  const { id } = req.params;
  const { title, description, ingredients, instructions, prep_time, cook_time, servings, tags }: Recipe = req.body;
  
  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Title, ingredients, and instructions are required' });
  }
  
  const updateRecipe = `
    UPDATE recipes 
    SET title = ?, description = ?, ingredients = ?, instructions = ?, prep_time = ?, cook_time = ?, servings = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(updateRecipe, [title, description, ingredients, instructions, prep_time, cook_time, servings, id], function(this: any, err: Error | null) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    db.run('DELETE FROM recipe_tags WHERE recipe_id = ?', [id], (err: Error | null) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (tags && tags.length > 0) {
        const tagPromises = tags.map(tagName => {
          return new Promise<void>((resolve, reject) => {
            db.get('SELECT id FROM tags WHERE name = ?', [tagName], (err: Error | null, row: { id: number } | undefined) => {
              if (err) {
                reject(err);
              } else if (row) {
                db.run('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)', [id, row.id], () => resolve());
              } else {
                db.run('INSERT INTO tags (name) VALUES (?)', [tagName], function(this: any, err: Error | null) {
                  if (err) {
                    reject(err);
                  } else {
                    db.run('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)', [id, this.lastID], () => resolve());
                  }
                });
              }
            });
          });
        });
        
        Promise.all(tagPromises)
          .then(() => res.json({ message: 'Recipe updated successfully' }))
          .catch(err => res.status(500).json({ error: err.message }));
      } else {
        res.json({ message: 'Recipe updated successfully' });
      }
    });
  });
});

app.delete('/api/recipes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  
  db.run('DELETE FROM recipes WHERE id = ?', [id], function(this: any, err: Error | null) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    return res.json({ message: 'Recipe deleted successfully' });
  });
});

app.get('/api/tags', (_req: Request, res: Response) => {
  const query = `
    SELECT id, name, parent_tag_id
    FROM tags
    ORDER BY name
  `;
  
  db.all(query, [], (err: Error | null, rows: DbTagRow[]) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const buildTree = (tags: DbTagRow[], parentId: number | null = null): Tag[] => {
      return tags
        .filter(tag => tag.parent_tag_id === parentId)
        .map(tag => ({
          ...tag,
          children: buildTree(tags, tag.id)
        }));
    };
    
    const tagTree: Tag[] = buildTree(rows);
    return res.json(tagTree);
  });
});

app.post('/api/tags', (req: any, res: any) => {
  const { name, parent_tag_id }: { name: string; parent_tag_id?: number } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Tag name is required' });
  }
  
  const insertTag = 'INSERT INTO tags (name, parent_tag_id) VALUES (?, ?)';
  
  db.run(insertTag, [name, parent_tag_id || null], function(this: any, err: Error | null) {
    if (err) {
      if ((err as any).code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ error: 'Tag name already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({ id: this.lastID, name, parent_tag_id: parent_tag_id || null });
  });
});

// Get recipes that use a specific tag (for impact assessment)
app.get('/api/tags/:id/recipes', (req: any, res: any) => {
  const tagId = parseInt(req.params.id);
  
  if (isNaN(tagId)) {
    return res.status(400).json({ error: 'Invalid tag ID' });
  }
  
  const query = `
    SELECT r.id, r.title, r.description
    FROM recipes r
    JOIN recipe_tags rt ON r.id = rt.recipe_id
    WHERE rt.tag_id = ?
    ORDER BY r.title
  `;
  
  db.all(query, [tagId], (err: Error | null, rows: any[]) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json(rows);
  });
});

// Delete a tag and handle cascading effects
app.delete('/api/tags/:id', (req: any, res: any) => {
  const tagId = parseInt(req.params.id);
  
  if (isNaN(tagId)) {
    return res.status(400).json({ error: 'Invalid tag ID' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // Get affected recipes
    db.all(
      'SELECT r.id, r.title FROM recipes r JOIN recipe_tags rt ON r.id = rt.recipe_id WHERE rt.tag_id = ?',
      [tagId],
      (err: Error | null, affectedRecipes: any[]) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: err.message });
        }
        
        // Get child tags that will be promoted
        db.all(
          'SELECT id, name FROM tags WHERE parent_tag_id = ?',
          [tagId],
          (err: Error | null, childTags: any[]) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: err.message });
            }
            
            // Get the parent tag ID for promotion
            db.get(
              'SELECT parent_tag_id FROM tags WHERE id = ?',
              [tagId],
              (err: Error | null, parentTag: any) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: err.message });
                }
                
                const newParentId = parentTag ? parentTag.parent_tag_id : null;
                
                // Update child tags to point to the deleted tag's parent
                db.run(
                  'UPDATE tags SET parent_tag_id = ? WHERE parent_tag_id = ?',
                  [newParentId, tagId],
                  (err: Error | null) => {
                    if (err) {
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: err.message });
                    }
                    
                    // Delete the tag (CASCADE will handle recipe_tags)
                    db.run(
                      'DELETE FROM tags WHERE id = ?',
                      [tagId],
                      (err: Error | null) => {
                        if (err) {
                          db.run('ROLLBACK');
                          return res.status(500).json({ error: err.message });
                        }
                        
                        db.run('COMMIT', (err: Error | null) => {
                          if (err) {
                            return res.status(500).json({ error: err.message });
                          }
                          
                          res.json({
                            message: 'Tag deleted successfully',
                            affectedRecipes: affectedRecipes.length,
                            promotedChildren: childTags.length,
                            details: {
                              affectedRecipes,
                              promotedChildren: childTags
                            }
                          });
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

// Update recipe tags
app.put('/api/recipes/:id/tags', (req: any, res: any) => {
  const { id } = req.params;
  const { tagIds }: { tagIds: number[] } = req.body;
  
  if (!Array.isArray(tagIds)) {
    return res.status(400).json({ error: 'tagIds must be an array' });
  }
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // First, remove all existing tags for this recipe
    db.run('DELETE FROM recipe_tags WHERE recipe_id = ?', [id], (err: Error | null) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: err.message });
      }
      
      // If no tags to add, just commit and return
      if (tagIds.length === 0) {
        db.run('COMMIT', (err: Error | null) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          
          // Return the updated recipe
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
          
          db.get(query, [id], (err: Error | null, row: any) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            if (!row) {
              return res.status(404).json({ error: 'Recipe not found' });
            }
            
            const recipe = {
              ...row,
              tags: row.tags ? JSON.parse(row.tags).filter((tag: any) => tag.id !== null) : []
            };
            
            res.json(recipe);
          });
        });
        return;
      }
      
      // Add new tags
      const insertPromises = tagIds.map(tagId => {
        return new Promise<void>((resolve, reject) => {
          db.run('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)', [id, tagId], (err: Error | null) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });
      
      Promise.all(insertPromises)
        .then(() => {
          db.run('COMMIT', (err: Error | null) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            
            // Return the updated recipe with full tag objects
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
            
            db.get(query, [id], (err: Error | null, row: any) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              
              if (!row) {
                return res.status(404).json({ error: 'Recipe not found' });
              }
              
              const recipe = {
                ...row,
                tags: row.tags ? JSON.parse(row.tags).filter((tag: any) => tag.id !== null) : []
              };
              
              res.json(recipe);
            });
          });
        })
        .catch(err => {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
        });
    });
  });
});

// Levenshtein distance for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }
  
  return matrix[b.length][a.length];
}

// Calculate fuzzy match score (0-1, higher is better)
function fuzzyMatchScore(query: string, text: string): number {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Exact match gets highest score
  if (textLower.includes(queryLower)) {
    return 1.0;
  }
  
  // Split into words for better matching
  const queryWords = queryLower.split(/\s+/);
  const textWords = textLower.split(/\s+/);
  
  let bestScore = 0;
  
  for (const queryWord of queryWords) {
    if (queryWord.length < 2) continue;
    
    for (const textWord of textWords) {
      if (textWord.length < 2) continue;
      
      // Prefix matching (high score)
      if (textWord.startsWith(queryWord)) {
        bestScore = Math.max(bestScore, 0.9);
        continue;
      }
      
      // Fuzzy matching with Levenshtein distance
      const maxLength = Math.max(queryWord.length, textWord.length);
      const distance = levenshteinDistance(queryWord, textWord);
      
      // Calculate similarity score
      let similarity = 1 - (distance / maxLength);
      
      // Apply stricter thresholds based on word length
      if (queryWord.length <= 3) {
        // Short words need exact or prefix match
        similarity = textWord.startsWith(queryWord) ? 0.8 : 0;
      } else if (queryWord.length <= 6) {
        // Medium words allow 1 character difference
        similarity = distance <= 1 ? similarity : 0;
      } else {
        // Long words allow 2 character difference
        similarity = distance <= 2 ? similarity : 0;
      }
      
      bestScore = Math.max(bestScore, similarity);
    }
  }
  
  return bestScore;
}

app.get('/api/search', (req: Request<{}, {}, {}, SearchParams>, res: Response) => {
  const { q, tags } = req.query;
  let query = `
    SELECT DISTINCT r.*, GROUP_CONCAT(t.name) as tags
    FROM recipes r
    LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
    LEFT JOIN tags t ON rt.tag_id = t.id
  `;
  
  const conditions: string[] = [];
  const params: string[] = [];
  
  // For text search, we'll get all recipes and do fuzzy matching in memory
  // This is acceptable for smaller datasets and provides better control
  if (q && tags) {
    // Both text and tag filters
    const tagList = tags.split(',').map(tag => tag.trim());
    const tagPlaceholders = tagList.map(() => '?').join(',');
    conditions.push(`r.id IN (
      SELECT rt2.recipe_id 
      FROM recipe_tags rt2 
      JOIN tags t2 ON rt2.tag_id = t2.id 
      WHERE t2.name IN (${tagPlaceholders})
      GROUP BY rt2.recipe_id 
      HAVING COUNT(DISTINCT t2.name) = ${tagList.length}
    )`);
    params.push(...tagList);
  } else if (tags) {
    // Only tag filters (exact matching for tags)
    const tagList = tags.split(',').map(tag => tag.trim());
    const tagPlaceholders = tagList.map(() => '?').join(',');
    conditions.push(`r.id IN (
      SELECT rt2.recipe_id 
      FROM recipe_tags rt2 
      JOIN tags t2 ON rt2.tag_id = t2.id 
      WHERE t2.name IN (${tagPlaceholders})
      GROUP BY rt2.recipe_id 
      HAVING COUNT(DISTINCT t2.name) = ${tagList.length}
    )`);
    params.push(...tagList);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' GROUP BY r.id ORDER BY r.created_at DESC';
  
  db.all(query, params, (err: Error | null, rows: DbRecipeRow[]) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    let recipes: Recipe[] = rows.map(row => ({
      ...row,
      tags: row.tags ? row.tags.split(',') : []
    }));
    
    // Apply fuzzy text search if query provided
    if (q) {
      const MIN_SIMILARITY_SCORE = 0.6; // 60% minimum similarity
      
      interface RecipeWithScore extends Recipe {
        _searchScore?: number;
      }
      
      const recipesWithScores: RecipeWithScore[] = recipes.map(recipe => {
        // Calculate fuzzy match scores for different fields with weights
        const titleScore = fuzzyMatchScore(q, recipe.title) * 3.0;
        const descriptionScore = fuzzyMatchScore(q, recipe.description || '') * 1.5;
        const ingredientsScore = fuzzyMatchScore(q, recipe.ingredients) * 2.0;
        const instructionsScore = fuzzyMatchScore(q, recipe.instructions) * 1.0;
        
        const maxScore = Math.max(titleScore, descriptionScore, ingredientsScore, instructionsScore);
        
        return {
          ...recipe,
          _searchScore: maxScore
        };
      }).filter(recipe => (recipe._searchScore || 0) >= MIN_SIMILARITY_SCORE);
      
      // Sort by relevance score (highest first)
      recipesWithScores.sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));
      
      // Remove score property before returning
      recipes = recipesWithScores.map(({ _searchScore, ...recipe }) => recipe);
    }
    
    return res.json(recipes);
  });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });