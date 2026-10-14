import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DocsPageBase, generateDocsPageMetadata } from '@/components/docs-page-base';
import { isBase } from '@/lib/base-routes';
import { paramsOfSection } from '@/lib/source';

export default async function BlocksPage(props: PageProps<'/blocks/[base]/[[...slug]]'>) {
  const { base, slug } = await props.params;
  if (!isBase(base)) notFound();
  return <DocsPageBase section='blocks' base={base} slug={slug} />;
}

export const dynamicParams = false;

export const generateStaticParams = () => paramsOfSection('blocks');

export async function generateMetadata(props: PageProps<'/blocks/[base]/[[...slug]]'>): Promise<Metadata> {
  const { base, slug } = await props.params;
  if (!isBase(base)) notFound();
  return generateDocsPageMetadata({ section: 'blocks', base, slug });
}
