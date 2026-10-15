import type { Metadata } from 'next';
import { DocsPageBase, generateDocsPageMetadata } from '@/components/docs-page-base';
import { docsSource } from '@/lib/source';

export default async function DocsPage(props: PageProps<'/docs/[[...slug]]'>) {
  const { slug } = await props.params;
  return <DocsPageBase section='docs' slug={slug} />;
}

export async function generateStaticParams() {
  return docsSource.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const { slug } = await props.params;
  return generateDocsPageMetadata({ section: 'docs', slug });
}
