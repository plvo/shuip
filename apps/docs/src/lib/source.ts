import { blocks, components, docs } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';
import { icons } from 'lucide-react';
import React from 'react';

const icon = (icon?: string) => {
  if (!icon) {
    return null;
  }
  if (icon in icons) return React.createElement(icons[icon as keyof typeof icons]);
};

export const docsSource = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  icon,
});

export const blocksSource = loader({
  baseUrl: '/blocks',
  source: blocks.toFumadocsSource(),
  icon,
});

export const componentsSource = loader({
  baseUrl: '/components',
  source: components.toFumadocsSource(),
  icon,
});

export const allPages = () => [...docsSource.getPages(), ...blocksSource.getPages(), ...componentsSource.getPages()];

export function getPageImage(
  page: InferPageType<typeof docsSource | typeof blocksSource | typeof componentsSource>,
  docsType: 'docs' | 'blocks' | 'components',
) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/og/${docsType}/${segments.join('/')}`,
  };
}

export async function getLLMText(
  page: InferPageType<typeof docsSource | typeof blocksSource | typeof componentsSource>,
) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
