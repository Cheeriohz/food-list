import { Router, Request, Response } from 'express';
import { getAllRecipes, getRecipeById, createRecipe, updateRecipe, deleteRecipe } from './recipe.service';
import { validateBody, validateParams } from '../middleware/validation';
import { CreateRecipeBodySchema, UpdateRecipeBodySchema, RecipeParamsSchema } from './recipe.validation';

export const recipeRouter = Router();

export const handleGetAllRecipes = async (_req: Request, res: Response): Promise<void> => {
  const result = await getAllRecipes();
  
  if (result.success) {
    res.json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const handleGetRecipeById = async (req: Request, res: Response): Promise<void> => {
  // Params are validated by middleware, so req.params.id is guaranteed to be a valid number
  const id = req.params.id as unknown as number;
  
  const result = await getRecipeById(id);
  
  if (result.success) {
    res.json(result.data);
  } else {
    if (result.error === 'Recipe not found') {
      res.status(404).json({ error: result.error });
    } else {
      res.status(500).json({ error: result.error });
    }
  }
};

export const handleCreateRecipe = async (req: Request, res: Response): Promise<void> => {
  // Body is validated by middleware, so all required fields are guaranteed to be present
  const { title, description, ingredients, instructions, prep_time, cook_time, servings, tags } = req.body;
  
  const result = await createRecipe({
    title,
    description,
    ingredients,
    instructions,
    prep_time,
    cook_time,
    servings,
    tags
  });
  
  if (result.success) {
    res.status(201).json({ id: result.data.id, message: 'Recipe created successfully' });
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const handleUpdateRecipe = async (req: Request, res: Response): Promise<void> => {
  // Params and body are validated by middleware
  const id = req.params.id as unknown as number;
  const { title, description, ingredients, instructions, prep_time, cook_time, servings, tags } = req.body;
  
  const result = await updateRecipe(id, {
    title,
    description,
    ingredients,
    instructions,
    prep_time,
    cook_time,
    servings,
    tags
  });
  
  if (result.success) {
    res.json({ message: 'Recipe updated successfully' });
  } else {
    if (result.error === 'Recipe not found') {
      res.status(404).json({ error: result.error });
    } else {
      res.status(500).json({ error: result.error });
    }
  }
};

export const handleDeleteRecipe = async (req: Request, res: Response): Promise<void> => {
  // Params are validated by middleware
  const id = req.params.id as unknown as number;
  
  const result = await deleteRecipe(id);
  
  if (result.success) {
    res.json({ message: 'Recipe deleted successfully' });
  } else {
    if (result.error === 'Recipe not found') {
      res.status(404).json({ error: result.error });
    } else {
      res.status(500).json({ error: result.error });
    }
  }
};

recipeRouter.get('/', handleGetAllRecipes);
recipeRouter.get('/:id', validateParams(RecipeParamsSchema), handleGetRecipeById);
recipeRouter.post('/', validateBody(CreateRecipeBodySchema), handleCreateRecipe);
recipeRouter.put('/:id', validateParams(RecipeParamsSchema), validateBody(UpdateRecipeBodySchema), handleUpdateRecipe);
recipeRouter.delete('/:id', validateParams(RecipeParamsSchema), handleDeleteRecipe);