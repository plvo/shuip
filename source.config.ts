import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from 'fumadocs-mdx/config';

const defaultOptions = {
  docs: {
    schema: frontmatterSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
};

export const docs = defineDocs({
  dir: 'content/docs',
  ...defaultOptions,
});

export const components = defineDocs({
  dir: 'content/components',
  ...defaultOptions,
});

export const blocks = defineDocs({
  dir: 'content/blocks',
  ...defaultOptions,
});

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
});
