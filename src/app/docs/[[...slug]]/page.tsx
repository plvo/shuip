import type { Metadata } from 'next';
import { DocsPageBase, generateDocsPageMetadata } from '@/components/docs-page-base';
import { docsSource } from '@/lib/source';

export default async function DocsPage(props: PageProps<'/docs/[[...slug]]'>) {
  return <DocsPageBase docsType='docs' props={props} />;
}

export async function generateStaticParams() {
  return docsSource.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  return generateDocsPageMetadata('docs', props);
}
