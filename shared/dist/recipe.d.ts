import { z } from 'zod';
export declare const RecipeSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodNumber>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    ingredients: z.ZodString;
    instructions: z.ZodString;
    prep_time: z.ZodOptional<z.ZodNumber>;
    cook_time: z.ZodOptional<z.ZodNumber>;
    servings: z.ZodOptional<z.ZodNumber>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    ingredients: string;
    instructions: string;
    tags?: any[] | undefined;
    id?: number | undefined;
    description?: string | undefined;
    created_at?: string | undefined;
    prep_time?: number | undefined;
    cook_time?: number | undefined;
    servings?: number | undefined;
    updated_at?: string | undefined;
}, {
    title: string;
    ingredients: string;
    instructions: string;
    tags?: any[] | undefined;
    id?: number | undefined;
    description?: string | undefined;
    created_at?: string | undefined;
    prep_time?: number | undefined;
    cook_time?: number | undefined;
    servings?: number | undefined;
    updated_at?: string | undefined;
}>;
export declare const CreateRecipeSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    ingredients: z.ZodString;
    instructions: z.ZodString;
    prep_time: z.ZodOptional<z.ZodNumber>;
    cook_time: z.ZodOptional<z.ZodNumber>;
    servings: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    ingredients: string;
    instructions: string;
    tags?: string[] | undefined;
    description?: string | undefined;
    prep_time?: number | undefined;
    cook_time?: number | undefined;
    servings?: number | undefined;
}, {
    title: string;
    ingredients: string;
    instructions: string;
    tags?: string[] | undefined;
    description?: string | undefined;
    prep_time?: number | undefined;
    cook_time?: number | undefined;
    servings?: number | undefined;
}>;
export declare const UpdateRecipeSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    ingredients: z.ZodOptional<z.ZodString>;
    instructions: z.ZodOptional<z.ZodString>;
    prep_time: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    cook_time: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    servings: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
} & {
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
    tags?: string[] | undefined;
    title?: string | undefined;
    description?: string | undefined;
    ingredients?: string | undefined;
    instructions?: string | undefined;
    prep_time?: number | undefined;
    cook_time?: number | undefined;
    servings?: number | undefined;
}, {
    id: number;
    tags?: string[] | undefined;
    title?: string | undefined;
    description?: string | undefined;
    ingredients?: string | undefined;
    instructions?: string | undefined;
    prep_time?: number | undefined;
    cook_time?: number | undefined;
    servings?: number | undefined;
}>;
export declare const RecipeResponseSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodNumber>;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    ingredients: z.ZodString;
    instructions: z.ZodString;
    prep_time: z.ZodOptional<z.ZodNumber>;
    cook_time: z.ZodOptional<z.ZodNumber>;
    servings: z.ZodOptional<z.ZodNumber>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
} & {
    tags: z.ZodOptional<z.ZodArray<z.ZodType<any, z.ZodTypeDef, any>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    ingredients: string;
    instructions: string;
    tags?: any[] | undefined;
    id?: number | undefined;
    description?: string | undefined;
    created_at?: string | undefined;
    prep_time?: number | undefined;
    cook_time?: number | undefined;
    servings?: number | undefined;
    updated_at?: string | undefined;
}, {
    title: string;
    ingredients: string;
    instructions: string;
    tags?: any[] | undefined;
    id?: number | undefined;
    description?: string | undefined;
    created_at?: string | undefined;
    prep_time?: number | undefined;
    cook_time?: number | undefined;
    servings?: number | undefined;
    updated_at?: string | undefined;
}>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type CreateRecipe = z.infer<typeof CreateRecipeSchema>;
export type UpdateRecipe = z.infer<typeof UpdateRecipeSchema>;
export type RecipeResponse = z.infer<typeof RecipeResponseSchema>;
//# sourceMappingURL=recipe.d.ts.map