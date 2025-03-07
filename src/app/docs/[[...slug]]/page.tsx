import type { Metadata } from 'next';
import { filenameToTitle, stringToUppercase } from '@/lib/utils';
import { MdxContent } from '@/components/shared/mdx-components';
import ComponentSection from '@/components/docs/component.section';
import { COMPONENT_CATEGORIES } from '#/registry/__index__';
import { getTableOfContents } from '@/lib/toc';
import { allDocs } from 'contentlayer/generated';
import { SidebarTableOfContents } from '@/components/docs/toc';
import Link from 'next/link';

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

export default async function Page({ params }: DocPageProps) {
  const { doc, slugArray } = await getDocAndSlugFromParams({ params });
  const { group, name, components, examples } = getComponentFromSlug(slugArray);

  const toc = doc ? await getTableOfContents(doc.body.raw) : undefined;

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

        {name && examples ? (
          <ComponentSection componentName={name} examples={examples} />
        ) : (
          components && (
            <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(components).map(([componentName, examples]) => {
                const doc = allDocs.find((doc) => doc.slug === componentName);

                return (
                  <Link
                    href={`/docs/${group}/${componentName}`}
                    passHref
                    className="bg-muted/50 rounded-lg flex flex-col justify-between gap-1 cursor-pointer p-6 hover:text-amber-400 transition-colors"
                    key={componentName}
                  >
                    <h4 className="h4-mdx">{doc ? doc.title : filenameToTitle(componentName)}</h4>
                    <p className="text-muted-foreground">{doc && doc.description}</p>
                    <p className="text-sm text-foreground/25">
                      {examples && examples.length + (examples.length > 1 ? ' examples' : ' example') + ' available'}
                    </p>
                  </Link>
                );
              })}
            </section>
          )
        )}
      </div>

      <div className="hidden text-sm xl:block border-l p-8 ml-8">
        <div className="sticky top-20 -mt-6">
          <div className="h-full overflow-auto">
            TODO
            {/* <SidebarTableOfContents toc={toc} componentsCategory={componentsCategory} /> */}
          </div>
        </div>
      </div>
    </main>
  );
}
