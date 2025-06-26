import { z } from 'zod';
export declare const SearchParamsSchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    q?: string | undefined;
    tags?: string | undefined;
}, {
    q?: string | undefined;
    tags?: string | undefined;
}>;
export declare const ApiResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}>, any>[k]; } : never, z.baseObjectInputType<{
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: z.baseObjectInputType<{
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}>[k_1]; } : never>;
export declare const SearchResultSchema: z.ZodObject<{
    id: z.ZodNumber;
    type: z.ZodEnum<["recipe", "tag"]>;
    score: z.ZodNumber;
    matchType: z.ZodEnum<["exact", "prefix", "fuzzy"]>;
    highlights: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        positions: z.ZodArray<z.ZodNumber, "many">;
    }, "strip", z.ZodTypeAny, {
        field: string;
        positions: number[];
    }, {
        field: string;
        positions: number[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "recipe" | "tag";
    id: number;
    score: number;
    matchType: "exact" | "prefix" | "fuzzy";
    highlights: {
        field: string;
        positions: number[];
    }[];
}, {
    type: "recipe" | "tag";
    id: number;
    score: number;
    matchType: "exact" | "prefix" | "fuzzy";
    highlights: {
        field: string;
        positions: number[];
    }[];
}>;
export declare const IndexedDocumentSchema: z.ZodObject<{
    id: z.ZodNumber;
    type: z.ZodEnum<["recipe", "tag"]>;
    title: z.ZodString;
    content: z.ZodString;
    tokens: z.ZodArray<z.ZodString, "many">;
    length: z.ZodNumber;
    fields: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        ingredients: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title: string;
        tags?: string | undefined;
        description?: string | undefined;
        ingredients?: string | undefined;
    }, {
        title: string;
        tags?: string | undefined;
        description?: string | undefined;
        ingredients?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: "recipe" | "tag";
    length: number;
    id: number;
    title: string;
    content: string;
    tokens: string[];
    fields: {
        title: string;
        tags?: string | undefined;
        description?: string | undefined;
        ingredients?: string | undefined;
    };
}, {
    type: "recipe" | "tag";
    length: number;
    id: number;
    title: string;
    content: string;
    tokens: string[];
    fields: {
        title: string;
        tags?: string | undefined;
        description?: string | undefined;
        ingredients?: string | undefined;
    };
}>;
export declare const RecipeTagSchema: z.ZodObject<{
    recipe_id: z.ZodNumber;
    tag_id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    recipe_id: number;
    tag_id: number;
}, {
    recipe_id: number;
    tag_id: number;
}>;
export type SearchParams = z.infer<typeof SearchParamsSchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type IndexedDocument = z.infer<typeof IndexedDocumentSchema>;
export type RecipeTag = z.infer<typeof RecipeTagSchema>;
//# sourceMappingURL=api.d.ts.map