import type { Metadata } from 'next';
import { DocsPageBase, generateDocsPageMetadata } from '@/components/docs-page-base';
import { componentsSource } from '@/lib/source';

export default async function ComponentsPage(props: PageProps<'/components/[[...slug]]'>) {
  return <DocsPageBase<'components'> docsType='components' props={props} />;
}

export async function generateStaticParams() {
  return componentsSource.generateParams();
}

export async function generateMetadata(props: PageProps<'/components/[[...slug]]'>): Promise<Metadata> {
  return generateDocsPageMetadata('components', props);
}
