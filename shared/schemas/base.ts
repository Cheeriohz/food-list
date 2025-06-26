import { z } from 'zod';

export const NonEmptyStringSchema = z.string().min(1, 'Cannot be empty');

export const PositiveIntegerSchema = z.number().int().positive('Must be a positive integer');

export const OptionalPositiveIntegerSchema = z.number().int().positive('Must be a positive integer').optional();

export const IdSchema = z.number().int().positive('ID must be a positive integer');

export const OptionalIdSchema = IdSchema.optional();

export const DateTimeStringSchema = z.string().datetime('Must be a valid ISO datetime string');

export const OptionalDateTimeStringSchema = DateTimeStringSchema.optional();