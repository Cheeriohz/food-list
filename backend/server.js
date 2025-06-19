const express = require('express');
const cors = require('cors');
const { db, initializeDatabase } = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/recipes', (req, res) => {
  const query = `
    SELECT r.*, GROUP_CONCAT(t.name) as tags
    FROM recipes r
    LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
    LEFT JOIN tags t ON rt.tag_id = t.id
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const recipes = rows.map(row => ({
      ...row,
      tags: row.tags ? row.tags.split(',') : []
    }));
    
    res.json(recipes);
  });
});

app.get('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT r.*, GROUP_CONCAT(t.name) as tags
    FROM recipes r
    LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
    LEFT JOIN tags t ON rt.tag_id = t.id
    WHERE r.id = ?
    GROUP BY r.id
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    const recipe = {
      ...row,
      tags: row.tags ? row.tags.split(',') : []
    };
    
    res.json(recipe);
  });
});

app.post('/api/recipes', (req, res) => {
  const { title, description, ingredients, instructions, prep_time, cook_time, servings, tags } = req.body;
  
  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Title, ingredients, and instructions are required' });
  }
  
  const insertRecipe = `
    INSERT INTO recipes (title, description, ingredients, instructions, prep_time, cook_time, servings)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(insertRecipe, [title, description, ingredients, instructions, prep_time, cook_time, servings], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const recipeId = this.lastID;
    
    if (tags && tags.length > 0) {
      const tagPromises = tags.map(tagName => {
        return new Promise((resolve, reject) => {
          db.get('SELECT id FROM tags WHERE name = ?', [tagName], (err, row) => {
            if (err) {
              reject(err);
            } else if (row) {
              db.run('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)', [recipeId, row.id], resolve);
            } else {
              db.run('INSERT INTO tags (name) VALUES (?)', [tagName], function(err) {
                if (err) {
                  reject(err);
                } else {
                  db.run('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)', [recipeId, this.lastID], resolve);
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

app.put('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, ingredients, instructions, prep_time, cook_time, servings, tags } = req.body;
  
  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Title, ingredients, and instructions are required' });
  }
  
  const updateRecipe = `
    UPDATE recipes 
    SET title = ?, description = ?, ingredients = ?, instructions = ?, prep_time = ?, cook_time = ?, servings = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  db.run(updateRecipe, [title, description, ingredients, instructions, prep_time, cook_time, servings, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    db.run('DELETE FROM recipe_tags WHERE recipe_id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (tags && tags.length > 0) {
        const tagPromises = tags.map(tagName => {
          return new Promise((resolve, reject) => {
            db.get('SELECT id FROM tags WHERE name = ?', [tagName], (err, row) => {
              if (err) {
                reject(err);
              } else if (row) {
                db.run('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)', [id, row.id], resolve);
              } else {
                db.run('INSERT INTO tags (name) VALUES (?)', [tagName], function(err) {
                  if (err) {
                    reject(err);
                  } else {
                    db.run('INSERT INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)', [id, this.lastID], resolve);
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

app.delete('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM recipes WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    
    res.json({ message: 'Recipe deleted successfully' });
  });
});

app.get('/api/tags', (req, res) => {
  const query = `
    SELECT id, name, parent_tag_id
    FROM tags
    ORDER BY name
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const buildTree = (tags, parentId = null) => {
      return tags
        .filter(tag => tag.parent_tag_id === parentId)
        .map(tag => ({
          ...tag,
          children: buildTree(tags, tag.id)
        }));
    };
    
    const tagTree = buildTree(rows);
    res.json(tagTree);
  });
});

app.post('/api/tags', (req, res) => {
  const { name, parent_tag_id } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Tag name is required' });
  }
  
  const insertTag = 'INSERT INTO tags (name, parent_tag_id) VALUES (?, ?)';
  
  db.run(insertTag, [name, parent_tag_id || null], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(400).json({ error: 'Tag name already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    
    res.status(201).json({ id: this.lastID, name, parent_tag_id: parent_tag_id || null });
  });
});

app.get('/api/search', (req, res) => {
  const { q, tags } = req.query;
  let query = `
    SELECT DISTINCT r.*, GROUP_CONCAT(t.name) as tags
    FROM recipes r
    LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
    LEFT JOIN tags t ON rt.tag_id = t.id
  `;
  
  const conditions = [];
  const params = [];
  
  if (q) {
    conditions.push('(r.title LIKE ? OR r.description LIKE ? OR r.ingredients LIKE ? OR r.instructions LIKE ?)');
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }
  
  if (tags) {
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
  
  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const recipes = rows.map(row => ({
      ...row,
      tags: row.tags ? row.tags.split(',') : []
    }));
    
    res.json(recipes);
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