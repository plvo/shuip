import { type InferPageType, loader } from 'fumadocs-core/source';
import { icons } from 'lucide-react';
import React from 'react';
import { blocks, components, docs } from '#/.source';

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

export const componentsSource = loader({
  baseUrl: '/components',
  source: components.toFumadocsSource(),
  icon,
});

export const blocksSource = loader({
  baseUrl: '/blocks',
  source: blocks.toFumadocsSource(),
  icon,
});

export const sourcePages = [...docsSource.getPages(), ...blocksSource.getPages(), ...componentsSource.getPages()];

export function getPageImage(page: InferPageType<typeof docsSource | typeof blocksSource>) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `/og/docs/${segments.join('/')}`,
  };
}

export async function getLLMText(page: InferPageType<typeof docsSource | typeof blocksSource>) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title}

${processed}`;
}
