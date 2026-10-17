import { z } from 'zod';

const stringRecord = z.record(z.string(), z.string());

const cssRules = z.record(z.string(), z.union([z.string(), z.record(z.string(), z.union([z.string(), stringRecord]))]));

/** The fields of a shadcn registry item that no scan can infer: an author writes them in `meta.shuip.json`. */
export const authoredFieldsSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  author: z.string().min(2).optional(),
  categories: z.array(z.string()).optional(),
  docs: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  cssVars: z
    .strictObject({
      theme: stringRecord.optional(),
      light: stringRecord.optional(),
      dark: stringRecord.optional(),
    })
    .optional(),
  css: cssRules.optional(),
  envVars: stringRecord.optional(),
});

export type AuthoredFields = z.infer<typeof authoredFieldsSchema>;
