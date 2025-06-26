"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagNamesArraySchema = exports.TagNameSchema = exports.UpdateTagSchema = exports.CreateTagSchema = exports.TagSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
exports.TagSchema = zod_1.z.lazy(() => zod_1.z.object({
    id: base_1.OptionalIdSchema,
    name: base_1.NonEmptyStringSchema,
    parent_tag_id: zod_1.z.number().int().positive().nullable().optional(),
    created_at: base_1.OptionalDateTimeStringSchema,
    children: zod_1.z.array(exports.TagSchema).optional()
}));
exports.CreateTagSchema = zod_1.z.object({
    name: base_1.NonEmptyStringSchema,
    parent_tag_id: zod_1.z.number().int().positive().nullable().optional()
});
exports.UpdateTagSchema = exports.CreateTagSchema.partial().extend({
    id: base_1.IdSchema
});
exports.TagNameSchema = base_1.NonEmptyStringSchema;
exports.TagNamesArraySchema = zod_1.z.array(exports.TagNameSchema);
//# sourceMappingURL=tag.js.map