/**
 * Come from https://github.com/shadcn/ui/blob/main/packages/cli/src/commands/build.ts
 * Fixed zod version to 4.x for Vercel deployment
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';

const buildOptionsSchema = z.object({
  cwd: z.string(),
  registryFile: z.string(),
  outputDir: z.string(),
});
// Note: if you edit the schema here, you must also edit the schema in the
// apps/v4/public/schema/registry-item.json file.

const registryConfigItemSchema = z.union([
  // Simple string format: "https://example.com/{name}.json"
  z
    .string()
    .refine((s) => s.includes('{name}'), {
      message: 'Registry URL must include {name} placeholder',
    }),
  // Advanced object format with auth options
  z.object({
    url: z.string().refine((s) => s.includes('{name}'), {
      message: 'Registry URL must include {name} placeholder',
    }),
    params: z.record(z.string(), z.string()).optional(),
    headers: z.record(z.string(), z.string()).optional(),
  }),
]);

export const registryConfigSchema = z.record(
  z.string().refine((key) => key.startsWith('@'), {
    message: 'Registry names must start with @ (e.g., @v0, @acme)',
  }),
  registryConfigItemSchema,
);

export const rawConfigSchema = z
  .object({
    $schema: z.string().optional(),
    style: z.string(),
    rsc: z.coerce.boolean().default(false),
    tsx: z.coerce.boolean().default(true),
    tailwind: z.object({
      config: z.string().optional(),
      css: z.string(),
      baseColor: z.string(),
      cssVariables: z.boolean().default(true),
      prefix: z.string().default('').optional(),
    }),
    iconLibrary: z.string().optional(),
    menuColor: z.enum(['default', 'inverted']).default('default').optional(),
    menuAccent: z.enum(['subtle', 'bold']).default('subtle').optional(),
    aliases: z.object({
      components: z.string(),
      utils: z.string(),
      ui: z.string().optional(),
      lib: z.string().optional(),
      hooks: z.string().optional(),
    }),
    registries: registryConfigSchema.optional(),
  })
  .strict();

export const configSchema = rawConfigSchema.extend({
  resolvedPaths: z.object({
    cwd: z.string(),
    tailwindConfig: z.string(),
    tailwindCss: z.string(),
    utils: z.string(),
    components: z.string(),
    lib: z.string(),
    hooks: z.string(),
    ui: z.string(),
  }),
});

export const registryItemTypeSchema = z.enum([
  'registry:lib',
  'registry:block',
  'registry:component',
  'registry:ui',
  'registry:hook',
  'registry:page',
  'registry:file',
  'registry:theme',
  'registry:style',
  'registry:item',
  'registry:base',
  'registry:font',

  // Internal use only.
  'registry:example',
  'registry:internal',
]);

export const registryItemFileSchema = z.discriminatedUnion('type', [
  // Target is required for registry:file and registry:page
  z.object({
    path: z.string(),
    content: z.string().optional(),
    type: z.enum(['registry:file', 'registry:page']),
    target: z.string(),
  }),
  z.object({
    path: z.string(),
    content: z.string().optional(),
    type: registryItemTypeSchema.exclude(['registry:file', 'registry:page']),
    target: z.string().optional(),
  }),
]);

export const registryItemTailwindSchema = z.object({
  config: z
    .object({
      content: z.array(z.string()).optional(),
      theme: z.record(z.string(), z.any()).optional(),
      plugins: z.array(z.string()).optional(),
    })
    .optional(),
});

export const registryItemCssVarsSchema = z.object({
  theme: z.record(z.string(), z.string()).optional(),
  light: z.record(z.string(), z.string()).optional(),
  dark: z.record(z.string(), z.string()).optional(),
});

// Recursive type for CSS properties that supports empty objects at any level.
const cssValueSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.string(),
    z.array(z.union([z.string(), z.record(z.string(), z.string())])),
    z.record(z.string(), cssValueSchema),
  ]),
);

export const registryItemCssSchema = z.record(z.string(), cssValueSchema);

export const registryItemEnvVarsSchema = z.record(z.string(), z.string());

// Font metadata schema for registry:font items.
export const registryItemFontSchema = z.object({
  family: z.string(),
  provider: z.literal('google'),
  import: z.string(),
  variable: z.string(),
  weight: z.array(z.string()).optional(),
  subsets: z.array(z.string()).optional(),
});

// Common fields shared by all registry items.
export const registryItemCommonSchema = z.object({
  $schema: z.string().optional(),
  extends: z.string().optional(),
  name: z.string(),
  title: z.string().optional(),
  author: z.string().min(2).optional(),
  description: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  devDependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  files: z.array(registryItemFileSchema).optional(),
  tailwind: registryItemTailwindSchema.optional(),
  cssVars: registryItemCssVarsSchema.optional(),
  css: registryItemCssSchema.optional(),
  envVars: registryItemEnvVarsSchema.optional(),
  meta: z.record(z.string(), z.any()).optional(),
  docs: z.string().optional(),
  categories: z.array(z.string()).optional(),
});

// registry:base has a config field, registry:font has a font field.
export const registryItemSchema = z.discriminatedUnion('type', [
  registryItemCommonSchema.extend({
    type: z.literal('registry:base'),
    config: rawConfigSchema.optional(),
  }),
  registryItemCommonSchema.extend({
    type: z.literal('registry:font'),
    font: registryItemFontSchema,
  }),
  registryItemCommonSchema.extend({
    type: registryItemTypeSchema.exclude(['registry:base', 'registry:font']),
  }),
]);

export const registrySchema = z.object({
  name: z.string(),
  homepage: z.string(),
  items: z.array(registryItemSchema),
});

export type Registry = z.infer<typeof registrySchema>;

export const build = async () => {
  try {
    const options = buildOptionsSchema.parse({
      cwd: process.cwd(),
      registryFile: path.resolve(process.cwd(), 'registry.json'),
      outputDir: 'public/r',
    });

    const content = await fs.readFile(options.registryFile, 'utf-8');

    const result = registrySchema.safeParse(JSON.parse(content));

    if (!result.success) {
      console.error(`Invalid registry file found at ${options.registryFile}.`);
      process.exit(1);
    }

    for (const registryItem of result.data.items) {
      // Add the schema to the registry item.
      registryItem.$schema = 'https://ui.shadcn.com/schema/registry-item.json';

      // Loop through each file in the files array.
      for (const file of registryItem.files ?? []) {
        file.content = await fs.readFile(path.resolve(options.cwd, file.path), 'utf-8');
      }

      // Validate the registry item.
      const result = registryItemSchema.safeParse(registryItem);
      if (!result.success) {
        console.error(`Invalid registry item found for ${registryItem.name}.`);
        continue;
      }

      // Write the registry item to the output directory.
      await fs.writeFile(
        path.resolve(options.outputDir, `${result.data.name}.json`),
        JSON.stringify(result.data, null, 2),
      );
    }

    // Copy registry.json to the output directory.
    await fs.copyFile(options.registryFile, path.resolve(options.outputDir, 'registry.json'));
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

build();
