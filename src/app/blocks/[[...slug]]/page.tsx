import type { Metadata } from 'next';
import { DocsPageBase, generateDocsPageMetadata } from '@/components/docs-page-base';
import { blocksSource } from '@/lib/source';

export default async function BlocksPage(props: PageProps<'/blocks/[[...slug]]'>) {
  return <DocsPageBase docsType='blocks' props={props} />;
}

export async function generateStaticParams() {
  return blocksSource.generateParams();
}

export async function generateMetadata(props: PageProps<'/blocks/[[...slug]]'>): Promise<Metadata> {
  return generateDocsPageMetadata('blocks', props);
}
