import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsPageBase, generateDocsPageMetadata } from '@/components/docs-page-base';
import { isBase } from '@/lib/base-routes';
import { paramsOfSection } from '@/lib/source';

export default async function ComponentsPage(props: PageProps<'/components/[base]/[[...slug]]'>) {
  const { base, slug } = await props.params;
  if (!isBase(base)) notFound();
  return <DocsPageBase section='components' base={base} slug={slug} />;
}

export const dynamicParams = false;

export const generateStaticParams = () => paramsOfSection('components');

export async function generateMetadata(props: PageProps<'/components/[base]/[[...slug]]'>): Promise<Metadata> {
  const { base, slug } = await props.params;
  if (!isBase(base)) notFound();
  return generateDocsPageMetadata({ section: 'components', base, slug });
}
