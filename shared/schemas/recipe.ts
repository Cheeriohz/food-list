import { z } from 'zod';
import { IdSchema, OptionalIdSchema, NonEmptyStringSchema, OptionalPositiveIntegerSchema, OptionalDateTimeStringSchema } from './base';
import { TagSchema, TagNamesArraySchema } from './tag';

export const RecipeSchema = z.object({
  id: OptionalIdSchema,
  title: NonEmptyStringSchema,
  description: z.string().optional(),
  ingredients: NonEmptyStringSchema,
  instructions: NonEmptyStringSchema,
  prep_time: OptionalPositiveIntegerSchema,
  cook_time: OptionalPositiveIntegerSchema,
  servings: OptionalPositiveIntegerSchema,
  created_at: OptionalDateTimeStringSchema,
  updated_at: OptionalDateTimeStringSchema,
  tags: z.array(TagSchema).optional()
});

export const CreateRecipeSchema = z.object({
  title: NonEmptyStringSchema,
  description: z.string().optional(),
  ingredients: NonEmptyStringSchema,
  instructions: NonEmptyStringSchema,
  prep_time: OptionalPositiveIntegerSchema,
  cook_time: OptionalPositiveIntegerSchema,
  servings: OptionalPositiveIntegerSchema,
  tags: TagNamesArraySchema.optional()
});

export const UpdateRecipeSchema = CreateRecipeSchema.partial().extend({
  id: IdSchema
});

export const RecipeResponseSchema = RecipeSchema.extend({
  tags: z.array(TagSchema).optional()
});

export type Recipe = z.infer<typeof RecipeSchema>;
export type CreateRecipe = z.infer<typeof CreateRecipeSchema>;
export type UpdateRecipe = z.infer<typeof UpdateRecipeSchema>;
export type RecipeResponse = z.infer<typeof RecipeResponseSchema>;