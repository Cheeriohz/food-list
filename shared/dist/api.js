"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeTagSchema = exports.IndexedDocumentSchema = exports.SearchResultSchema = exports.ApiResponseSchema = exports.SearchParamsSchema = void 0;
const zod_1 = require("zod");
exports.SearchParamsSchema = zod_1.z.object({
    q: zod_1.z.string().optional(),
    tags: zod_1.z.string().optional()
});
const ApiResponseSchema = (dataSchema) => zod_1.z.object({
    data: dataSchema.optional(),
    error: zod_1.z.string().optional(),
    message: zod_1.z.string().optional()
});
exports.ApiResponseSchema = ApiResponseSchema;
exports.SearchResultSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive(),
    type: zod_1.z.enum(['recipe', 'tag']),
    score: zod_1.z.number().min(0).max(1),
    matchType: zod_1.z.enum(['exact', 'prefix', 'fuzzy']),
    highlights: zod_1.z.array(zod_1.z.object({
        field: zod_1.z.string(),
        positions: zod_1.z.array(zod_1.z.number().int().nonnegative())
    }))
});
exports.IndexedDocumentSchema = zod_1.z.object({
    id: zod_1.z.number().int().positive(),
    type: zod_1.z.enum(['recipe', 'tag']),
    title: zod_1.z.string(),
    content: zod_1.z.string(),
    tokens: zod_1.z.array(zod_1.z.string()),
    length: zod_1.z.number().int().nonnegative(),
    fields: zod_1.z.object({
        title: zod_1.z.string(),
        description: zod_1.z.string().optional(),
        ingredients: zod_1.z.string().optional(),
        tags: zod_1.z.string().optional()
    })
});
exports.RecipeTagSchema = zod_1.z.object({
    recipe_id: zod_1.z.number().int().positive(),
    tag_id: zod_1.z.number().int().positive()
});
//# sourceMappingURL=api.js.map