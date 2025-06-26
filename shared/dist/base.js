"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptionalDateTimeStringSchema = exports.DateTimeStringSchema = exports.OptionalIdSchema = exports.IdSchema = exports.OptionalPositiveIntegerSchema = exports.PositiveIntegerSchema = exports.NonEmptyStringSchema = void 0;
const zod_1 = require("zod");
exports.NonEmptyStringSchema = zod_1.z.string().min(1, 'Cannot be empty');
exports.PositiveIntegerSchema = zod_1.z.number().int().positive('Must be a positive integer');
exports.OptionalPositiveIntegerSchema = zod_1.z.number().int().positive('Must be a positive integer').optional();
exports.IdSchema = zod_1.z.number().int().positive('ID must be a positive integer');
exports.OptionalIdSchema = exports.IdSchema.optional();
exports.DateTimeStringSchema = zod_1.z.string().datetime('Must be a valid ISO datetime string');
exports.OptionalDateTimeStringSchema = exports.DateTimeStringSchema.optional();
//# sourceMappingURL=base.js.map