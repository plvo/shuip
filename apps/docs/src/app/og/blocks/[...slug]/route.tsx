/** biome-ignore-all lint/performance/noImgElement: false positive */

import { generate as DefaultImage } from 'fumadocs-ui/og';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { DEFAULT_BASE } from '@/lib/base-routes';
import { ogMark } from '@/lib/og-mark';
import { blocksSources, getPageImage, pageSlugFromImageSegments } from '@/lib/source';

// Both bases share one image: the title and the description do not depend on the base.
const blocksSource = blocksSources[DEFAULT_BASE];

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/blocks/[...slug]'>) {
  const { slug } = await params;
  const page = blocksSource.getPage(pageSlugFromImageSegments(slug));
  if (!page) notFound();

  const { title, description } = page.data;

  const truncatedDescription =
    description && description.length > 120 ? `${description.slice(0, 120)}...` : description;

  return new ImageResponse(
    <DefaultImage
      site='shuip'
      title={<span style={{ color: 'rgb(5, 105, 255)' }}>{title}</span>}
      description={truncatedDescription}
      icon={ogMark}
      primaryColor='rgba(5, 105, 255, 0.15)'
      primaryTextColor='white'
    />,
    {
      width: 1200,
      height: 630,
    },
  );
}

export function generateStaticParams() {
  return blocksSource.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page, 'blocks').segments,
  }));
}
