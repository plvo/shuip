import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsPageBase, generateDocsPageMetadata } from '@/components/docs-page-base';
import { BASES, isBase } from '@/lib/base-routes';
import { componentsSources } from '@/lib/source';

export default async function ComponentsPage(props: PageProps<'/components/[base]/[[...slug]]'>) {
  const { base, slug } = await props.params;
  if (!isBase(base)) notFound();
  return <DocsPageBase section='components' base={base} slug={slug} />;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  return BASES.flatMap((base) => componentsSources[base].generateParams().map((params) => ({ base, ...params })));
}

export async function generateMetadata(props: PageProps<'/components/[base]/[[...slug]]'>): Promise<Metadata> {
  const { base, slug } = await props.params;
  if (!isBase(base)) notFound();
  return generateDocsPageMetadata({ section: 'components', base, slug });
}
