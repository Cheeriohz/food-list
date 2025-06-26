import { z } from 'zod';

export const SearchParamsSchema = z.object({
  q: z.string().optional(),
  tags: z.string().optional()
});

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional()
  });

export const SearchResultSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(['recipe', 'tag']),
  score: z.number().min(0).max(1),
  matchType: z.enum(['exact', 'prefix', 'fuzzy']),
  highlights: z.array(
    z.object({
      field: z.string(),
      positions: z.array(z.number().int().nonnegative())
    })
  )
});

export const IndexedDocumentSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(['recipe', 'tag']),
  title: z.string(),
  content: z.string(),
  tokens: z.array(z.string()),
  length: z.number().int().nonnegative(),
  fields: z.object({
    title: z.string(),
    description: z.string().optional(),
    ingredients: z.string().optional(),
    tags: z.string().optional()
  })
});

export const RecipeTagSchema = z.object({
  recipe_id: z.number().int().positive(),
  tag_id: z.number().int().positive()
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type IndexedDocument = z.infer<typeof IndexedDocumentSchema>;
export type RecipeTag = z.infer<typeof RecipeTagSchema>;