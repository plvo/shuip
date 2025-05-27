import CardComponent from '@/components/docs/card.component';
import ComponentSection from '@/components/docs/component.section';
import { SidebarTableOfContents } from '@/components/docs/toc';
import { MdxContent } from '@/components/shared/mdx-components';
import { getTableOfContents } from '@/lib/toc';
import { filenameToTitle, stringToUppercase } from '@/lib/utils';
import { allDocs } from 'contentlayer/generated';
import type { Metadata } from 'next';
import { COMPONENT_CATEGORIES } from '#/registry/__index__';

export interface DocPageProps {
  params: Promise<{ slug: string[] }>;
}

async function getDocAndSlugFromParams({ params }: DocPageProps) {
  const { slug } = await params;
  const docName = slug ? slug.at(-1) : '';
  const doc = allDocs.find((doc) => doc.slug === docName);

  console.log({
    slug,
    docName,
    // doc,
  });

  return { doc, slugArray: slug || [] };
}

function getComponentFromSlug(slug: string[]) {
  if (!slug.length) {
    return { component: null, examples: [] };
  }

  const [group, name] = slug;
  const components = COMPONENT_CATEGORIES[group] || null;
  const examples = components ? components[name] : null;

  return { group, name, components, examples };
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { doc, slugArray } = await getDocAndSlugFromParams({ params });

  if (!doc) {
    return {
      title: slugArray.length ? filenameToTitle(slugArray.at(-1) || 'Not Found') : 'Not Found',
    };
  }

  return {
    title: stringToUppercase(doc.title),
    description: doc.description,
  };
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  const docRoutes = allDocs.filter((doc) => doc.GettingStartedPosition).map((doc) => ({ slug: [doc.slug] }));

  const componentRoutes = Object.entries(COMPONENT_CATEGORIES).flatMap(([group, components]) => {
    const groupParam = { slug: [group] };
    const componentParams = Object.keys(components).map((name) => ({
      slug: [group, name],
    }));
    return [groupParam, ...componentParams];
  });

  return [...docRoutes, ...componentRoutes];
}

export default async function Page({ params }: DocPageProps) {
  const { doc, slugArray } = await getDocAndSlugFromParams({ params });
  const toc = doc ? await getTableOfContents(doc.body.raw) : undefined;

  return (
    <div className='xl:grid xl:grid-cols-[1fr_350px]'>
      {doc && (
        <article>
          <div className='space-y-2 mb-10'>
            <h1 className={'h1-mdx'}>{doc.title}</h1>
            <p className='text-base text-muted-foreground'>{doc.description}</p>
          </div>
          <MdxContent code={doc.body.code} />
        </article>
      )}

      <SidebarTableOfContents {...{ toc }} />
    </div>
  );
}
