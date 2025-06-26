"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipeResponseSchema = exports.UpdateRecipeSchema = exports.CreateRecipeSchema = exports.RecipeSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
const tag_1 = require("./tag");
exports.RecipeSchema = zod_1.z.object({
    id: base_1.OptionalIdSchema,
    title: base_1.NonEmptyStringSchema,
    description: zod_1.z.string().optional(),
    ingredients: base_1.NonEmptyStringSchema,
    instructions: base_1.NonEmptyStringSchema,
    prep_time: base_1.OptionalPositiveIntegerSchema,
    cook_time: base_1.OptionalPositiveIntegerSchema,
    servings: base_1.OptionalPositiveIntegerSchema,
    created_at: base_1.OptionalDateTimeStringSchema,
    updated_at: base_1.OptionalDateTimeStringSchema,
    tags: zod_1.z.array(tag_1.TagSchema).optional()
});
exports.CreateRecipeSchema = zod_1.z.object({
    title: base_1.NonEmptyStringSchema,
    description: zod_1.z.string().optional(),
    ingredients: base_1.NonEmptyStringSchema,
    instructions: base_1.NonEmptyStringSchema,
    prep_time: base_1.OptionalPositiveIntegerSchema,
    cook_time: base_1.OptionalPositiveIntegerSchema,
    servings: base_1.OptionalPositiveIntegerSchema,
    tags: tag_1.TagNamesArraySchema.optional()
});
exports.UpdateRecipeSchema = exports.CreateRecipeSchema.partial().extend({
    id: base_1.IdSchema
});
exports.RecipeResponseSchema = exports.RecipeSchema.extend({
    tags: zod_1.z.array(tag_1.TagSchema).optional()
});
//# sourceMappingURL=recipe.js.map