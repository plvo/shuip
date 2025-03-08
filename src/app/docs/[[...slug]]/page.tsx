import type { Metadata } from 'next';
import { filenameToTitle, stringToUppercase } from '@/lib/utils';
import { MdxContent } from '@/components/shared/mdx-components';
import ComponentSection from '@/components/docs/component.section';
import { COMPONENT_CATEGORIES } from '#/registry/__index__';
import { getTableOfContents } from '@/lib/toc';
import { allDocs } from 'contentlayer/generated';
import { SidebarTableOfContents } from '@/components/docs/toc';
import CardComponent from '@/components/docs/card.component';

export interface DocPageProps {
  params: Promise<{ slug: string[] }>;
}

async function getDocAndSlugFromParams({ params }: DocPageProps) {
  const { slug } = await params;
  const docName = slug ? slug.at(-1) : '';
  const doc = allDocs.find((doc) => doc.slug === docName);

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
  const { doc } = await getDocAndSlugFromParams({ params });

  if (!doc) {
    return {
      title: 'Not Found',
    };
  }

  return {
    title: stringToUppercase(doc.title),
    description: doc.description,
  };
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  return Object.entries(COMPONENT_CATEGORIES).flatMap(([group, components]) => {
    const groupParam = { slug: [group] };

    const componentParams = Object.keys(components).map((name) => ({
      slug: [group, name],
    }));

    return [groupParam, ...componentParams];
  });
}

export default async function Page({ params }: DocPageProps) {
  const { doc, slugArray } = await getDocAndSlugFromParams({ params });
  const { group, name, components, examples } = getComponentFromSlug(slugArray);
  const toc = doc ? await getTableOfContents(doc.body.raw) : undefined;

  const isComponentPage = !!name && !!examples;
  const hasExamples = examples ? examples.length > 1 : false;

  return (
    <main className="xl:grid xl:grid-cols-[1fr_350px]">
      <div>
        {doc && (
          <>
            <div className="space-y-2 mb-10">
              <h1 className={'h1-mdx'}>{doc.title}</h1>
              <p className="text-base text-muted-foreground">{doc.description}</p>
            </div>
            <MdxContent code={doc.body.code} />
          </>
        )}

        {isComponentPage ? (
          <ComponentSection componentName={name} examples={examples} />
        ) : (
          components && (
            <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(components).map(([componentName, examples]) => {
                const doc = allDocs.find((doc) => doc.slug === componentName);
                return <CardComponent key={componentName} {...{ componentName, group, doc, examples }} />;
              })}
            </section>
          )
        )}
      </div>

      <SidebarTableOfContents {...{ toc, isComponentPage, hasExamples }} />
    </main>
  );
}
