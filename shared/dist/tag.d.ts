import { z } from 'zod';
export declare const TagSchema: z.ZodSchema<any>;
export declare const CreateTagSchema: z.ZodObject<{
    name: z.ZodString;
    parent_tag_id: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    parent_tag_id?: number | null | undefined;
}, {
    name: string;
    parent_tag_id?: number | null | undefined;
}>;
export declare const UpdateTagSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    parent_tag_id: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodNumber>>>;
} & {
    id: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
    name?: string | undefined;
    parent_tag_id?: number | null | undefined;
}, {
    id: number;
    name?: string | undefined;
    parent_tag_id?: number | null | undefined;
}>;
export declare const TagNameSchema: z.ZodString;
export declare const TagNamesArraySchema: z.ZodArray<z.ZodString, "many">;
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
//# sourceMappingURL=tag.d.ts.map