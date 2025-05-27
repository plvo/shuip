import ComponentSection from '@/components/documentation/component-section';
import { SidebarTableOfContents } from '@/components/documentation/toc';
import { MdxContent } from '@/components/shared/mdx';
import { getDocAndSlugFromParams } from '@/lib/content';
import { getTableOfContents } from '@/lib/toc';
import { filenameToTitle } from '@/lib/utils';
import { firstCharUppercase } from '@/lib/utils';
import type { Metadata } from 'next';
import { COMPONENT_CATEGORIES } from '#/registry/__index__';

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { document, slugArray } = await getDocAndSlugFromParams({ params, type: 'Component' });

  if (!document) {
    return {
      title: slugArray.length ? filenameToTitle(slugArray.at(-1) ?? 'Not Found') : 'Not Found',
    };
  }

  return {
    title: firstCharUppercase(document.title),
    description: document.description,
  };
}

function getComponentFromSlug(slug: string[]) {
  if (!slug.length) {
    return { component: null, examples: [] };
  }

  const [name] = slug;
  const components = COMPONENT_CATEGORIES[name] || null;
  const examples = components ? components[name] : null;

  return { name, components, examples };
}

export default async function Page({ params }: DocPageProps) {
  const { document, slugArray } = await getDocAndSlugFromParams({ params, type: 'Component' });
  const toc = document ? await getTableOfContents(document.body.raw) : undefined;
  const { name, components, examples } = getComponentFromSlug(slugArray);

  const hasExamples = examples ? examples.length > 1 : false;

  return (
    <div className='xl:grid xl:grid-cols-[1fr_350px]'>
      {document && !!name && (
        <article>
          <div className='space-y-2 mb-10'>
            <h1 className={'h1-mdx'}>{document.title}</h1>
            <p className='text-base text-muted-foreground'>{document.description}</p>
          </div>
          <MdxContent code={document.body.code} />
          <ComponentSection componentName={name} examples={examples ?? []} />
        </article>
      )}

      <SidebarTableOfContents {...{ toc, isComponentPage: true, hasExamples }} />
    </div>
  );
}
