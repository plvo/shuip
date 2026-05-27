/** biome-ignore-all lint/performance/noImgElement: false positive */

import { generate as DefaultImage } from 'fumadocs-ui/og';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { componentsSource, getPageImage } from '@/lib/source';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/components/[...slug]'>) {
  const { slug } = await params;
  const page = componentsSource.getPage(slug);
  if (!page) notFound();

  const { title, description } = page.data;

  const truncatedDescription =
    description && description.length > 120 ? `${description.slice(0, 120)}...` : description;

  return new ImageResponse(
    <DefaultImage
      site='shuip'
      title={<span style={{ color: 'rgb(5, 105, 255)' }}>{title}</span>}
      description={truncatedDescription}
      icon={<img src={getPageImage(page, 'components').url} alt={title} width={64} height={64} />}
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
  return componentsSource.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page, 'components').segments,
  }));
}
