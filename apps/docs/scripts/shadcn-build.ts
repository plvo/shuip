import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { z } from 'zod';

const REGISTRY_PKG = path.resolve(import.meta.dir, '..', '..', '..', 'packages', 'registry');

const buildOptionsSchema = z.object({
  cwd: z.string(),
  registryFile: z.string(),
  outputDir: z.string(),
});

const registryItemTypeSchema = z.enum([
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
  'registry:example',
  'registry:internal',
]);

const registryItemFileSchema = z.discriminatedUnion('type', [
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

const registryItemCommonSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  type: registryItemTypeSchema,
  dependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  files: z.array(registryItemFileSchema).optional(),
});

const registrySchema = z.object({
  name: z.string(),
  homepage: z.string(),
  items: z.array(registryItemCommonSchema),
});

const build = async () => {
  const options = buildOptionsSchema.parse({
    cwd: REGISTRY_PKG,
    registryFile: path.resolve(REGISTRY_PKG, 'registry.json'),
    outputDir: path.resolve(import.meta.dir, '..', 'public', 'r'),
  });

  await fs.mkdir(options.outputDir, { recursive: true });

  const content = await fs.readFile(options.registryFile, 'utf-8');
  const result = registrySchema.safeParse(JSON.parse(content));
  if (!result.success) {
    console.error(`Invalid registry file: ${options.registryFile}`);
    console.error(result.error.message);
    process.exit(1);
  }

  for (const registryItem of result.data.items) {
    const item: any = { ...registryItem, $schema: 'https://ui.shadcn.com/schema/registry-item.json' };
    for (const file of item.files ?? []) {
      file.content = await fs.readFile(path.resolve(options.cwd, file.path), 'utf-8');
    }
    await fs.writeFile(path.resolve(options.outputDir, `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`);
  }
  await fs.copyFile(options.registryFile, path.resolve(options.outputDir, 'registry.json'));
  console.log(`[shadcn-build] ${result.data.items.length} items written to ${options.outputDir}`);
};

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
