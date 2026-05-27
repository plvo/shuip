import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from 'fumadocs-mdx/config';
import { z } from 'zod';

const schema = frontmatterSchema.extend({
  registryName: z.string().optional(),
});

const defaultOptions = {
  docs: {
    schema,
    postprocess: { includeProcessedMarkdown: true },
  },
  meta: { schema: metaSchema },
};

export const docs = defineDocs({
  dir: './content/docs',
  ...defaultOptions,
});

export const blocks = defineDocs({
  dir: './content/blocks',
  ...defaultOptions,
});

export const components = defineDocs({
  dir: './content/components',
  ...defaultOptions,
});

export default defineConfig({ mdxOptions: {} });
