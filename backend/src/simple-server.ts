import express, { Request, Response } from 'express';
import cors from 'cors';
import * as db from './memory-database';
import { Recipe, SearchParams } from './types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/recipes', (req: Request, res: Response) => {
  const recipes = db.getAllRecipes();
  res.json(recipes);
});

app.get('/api/recipes/:id', (req: any, res: any) => {
  const { id } = req.params;
  const recipe = db.getRecipeById(id);
  
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  res.json(recipe);
});

app.post('/api/recipes', (req: any, res: any) => {
  const { title, description, ingredients, instructions, prep_time, cook_time, servings, tags }: Recipe = req.body;
  
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

app.put('/api/recipes/:id', (req: any, res: any) => {
  const { id } = req.params;
  const { title, description, ingredients, instructions, prep_time, cook_time, servings, tags }: Recipe = req.body;
  
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

app.delete('/api/recipes/:id', (req: any, res: any) => {
  const { id } = req.params;
  
  const deleted = db.deleteRecipe(id);
  
  if (!deleted) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  
  res.json({ message: 'Recipe deleted successfully' });
});

app.get('/api/tags', (req: Request, res: Response) => {
  const tags = db.getAllTags();
  res.json(tags);
});

app.post('/api/tags', (req: any, res: any) => {
  const { name, parent_tag_id }: { name: string; parent_tag_id?: number } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Tag name is required' });
  }
  
  const tag = db.createTag({
    name,
    parent_tag_id: parent_tag_id ?? null
  });
  
  res.status(201).json(tag);
});

app.get('/api/search', (req: Request<{}, {}, {}, SearchParams>, res: Response) => {
  const { q, tags } = req.query;
  const tagList = tags ? tags.split(',').map(tag => tag.trim()) : [];
  
  const recipes = db.searchRecipes(q, tagList);
  res.json(recipes);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});