import { z } from 'zod';
import { IdSchema, OptionalIdSchema, NonEmptyStringSchema, OptionalDateTimeStringSchema } from './base';

export const TagSchema: z.ZodSchema<any> = z.lazy(() => z.object({
  id: OptionalIdSchema,
  name: NonEmptyStringSchema,
  parent_tag_id: z.number().int().positive().nullable().optional(),
  created_at: OptionalDateTimeStringSchema,
  children: z.array(TagSchema).optional()
}));

export const CreateTagSchema = z.object({
  name: NonEmptyStringSchema,
  parent_tag_id: z.number().int().positive().nullable().optional()
});

export const UpdateTagSchema = CreateTagSchema.partial().extend({
  id: IdSchema
});

export const TagNameSchema = NonEmptyStringSchema;

export const TagNamesArraySchema = z.array(TagNameSchema);

export type Tag = {
  id?: number;
  name: string;
  parent_tag_id?: number | null;
  created_at?: string;
  children?: Tag[];
};

export type CreateTag = z.infer<typeof CreateTagSchema>;
export type UpdateTag = z.infer<typeof UpdateTagSchema>;
export type TagName = z.infer<typeof TagNameSchema>;