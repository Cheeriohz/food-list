const express = require('express');
const cors = require('cors');
const db = require('./memory-database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/recipes', (req, res) => {
  const recipes = db.getAllRecipes();
  res.json(recipes);
});

app.get('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  const recipe = db.getRecipeById(id);
  
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  res.json(recipe);
});

app.post('/api/recipes', (req, res) => {
  const { title, description, ingredients, instructions, prep_time, cook_time, servings, tags } = req.body;
  
  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Title, ingredients, and instructions are required' });
  }
  
  const recipe = db.createRecipe({
    title,
    description,
    ingredients,
    instructions,
    prep_time,
    cook_time,
    servings,
    tags: tags || []
  });
  
  res.status(201).json(recipe);
});

app.put('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, ingredients, instructions, prep_time, cook_time, servings, tags } = req.body;
  
  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Title, ingredients, and instructions are required' });
  }
  
  const recipe = db.updateRecipe(id, {
    title,
    description,
    ingredients,
    instructions,
    prep_time,
    cook_time,
    servings,
    tags: tags || []
  });
  
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  res.json(recipe);
});

app.delete('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  
  const deleted = db.deleteRecipe(id);
  
  if (!deleted) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  res.json({ message: 'Recipe deleted successfully' });
});

app.get('/api/tags', (req, res) => {
  const tags = db.getAllTags();
  res.json(tags);
});

app.post('/api/tags', (req, res) => {
  const { name, parent_tag_id } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Tag name is required' });
  }
  
  const tag = db.createTag({
    name,
    parent_tag_id: parent_tag_id || null
  });
  
  res.status(201).json(tag);
});

app.get('/api/search', (req, res) => {
  const { q, tags } = req.query;
  const tagList = tags ? tags.split(',').map(tag => tag.trim()) : [];
  
  const recipes = db.searchRecipes(q, tagList);
  res.json(recipes);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});