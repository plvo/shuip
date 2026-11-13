import { generate as DefaultImage } from 'fumadocs-ui/og';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { ShuipMark } from '@/components/shuip-mark';
import type { Section } from './base-routes';
import { type AnyPage, getPageImage, pageForOgImage } from './source';

export const revalidate = false;

/** A source an og image route can look a page up in and prerender pages from. */
export type OgImageSource = {
  getPage(slugs: string[] | undefined): AnyPage | undefined;
  getPages(): AnyPage[];
};

/**
 * The one og image handler: the catch-all of every `/og/<section>/<slug>/image.png`
 * route looks the page up the same way, and static params prerender the same segments.
 */
export async function GET(source: OgImageSource, slug: string[]) {
  const page = pageForOgImage(source, slug);
  if (!page) notFound();

  const { title, description } = page.data;

  const truncatedDescription =
    description && description.length > 120 ? `${description.slice(0, 120)}...` : description;

  return new ImageResponse(
    <DefaultImage
      site='shuip'
      title={<span style={{ color: 'rgb(5, 105, 255)' }}>{title}</span>}
      description={truncatedDescription}
      icon={<ShuipMark size={56} />}
      primaryColor='rgba(5, 105, 255, 0.15)'
      primaryTextColor='white'
    />,
    {
      width: 1200,
      height: 630,
    },
  );
}

/** The static params of an og image route: every page of the section, at its `image.png` segment. */
export function generateStaticParams(source: OgImageSource, section: Section) {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page, section).segments,
  }));
}
