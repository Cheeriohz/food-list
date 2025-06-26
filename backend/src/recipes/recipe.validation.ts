import { z } from 'zod';

export const CreateRecipeBodySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  ingredients: z.string().min(1, 'Ingredients are required'),
  instructions: z.string().min(1, 'Instructions are required'),
  prep_time: z.number().int().positive().optional(),
  cook_time: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional()
});

export const UpdateRecipeBodySchema = CreateRecipeBodySchema;

export const RecipeParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Recipe ID must be a positive integer').transform(Number)
});

export const SearchQuerySchema = z.object({
  q: z.string().optional(),
  tags: z.string().optional()
});

export type CreateRecipeBody = z.infer<typeof CreateRecipeBodySchema>;
export type UpdateRecipeBody = z.infer<typeof UpdateRecipeBodySchema>;
export type RecipeParams = z.infer<typeof RecipeParamsSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;