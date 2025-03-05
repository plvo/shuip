import type { Metadata } from 'next';
import { cn, stringToUppercase } from '@/lib/utils';
import { MdxContent } from '@/components/shared/mdx-components';
import ComponentSections from '@/components/docs/component.section';
import { COMPONENT_CATEGORIES } from '#/registry/__index__';
import { getTableOfContents } from '@/lib/toc';
import { allDocs } from 'contentlayer/generated';
import { SidebarTableOfContents } from '@/components/docs/toc';

export interface DocPageProps {
  params: Promise<{ slug: string[] }>;
}

/**
 * TODO: need to change this it's horrible
 * @param slugPath: path of the page
 * @returns the doc object
 */
async function getDocAndSlugFromParams({ params }: DocPageProps) {
  const { slug } = await params;
  const slugPath = slug ? slug.join('/') : '';

  const doc = allDocs.find((doc) => {
    if (doc.slug.startsWith('docs/')) {
      return doc.slug.slice(5) === slugPath;
    }
    return doc.slug.slice(4) === slugPath;
  });

  return { doc, slug: slugPath };
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
  const { doc, slug } = await getDocAndSlugFromParams({ params });
  const componentsCategory = COMPONENT_CATEGORIES[slug] || null;

  const toc = doc ? await getTableOfContents(doc.body.raw) : null;

  return (
    <main className="xl:grid xl:grid-cols-[1fr_350px]">
      <div>
        {doc && (
          <>
            <div className="space-y-2 mb-10">
              <h1 className={cn('scroll-m-20 text-4xl font-bold tracking-tight')}>{doc.title}</h1>
              <p className="text-base text-muted-foreground">{doc.description}</p>
            </div>
            <MdxContent code={doc.body.code} />
          </>
        )}

        {componentsCategory && (
          <div className="space-y-8">
            {Object.entries(componentsCategory).map((c, i) => (
              <ComponentSections component={c} key={i} />
            ))}
          </div>
        )}
      </div>

      <div className="hidden text-sm xl:block border-l px-8 ml-8">
        <div className="sticky top-20 -mt-6 pt-4">
          <div className="h-full overflow-auto">
            <SidebarTableOfContents {...(toc && toc)} componentsCategory={componentsCategory} />
          </div>
        </div>
      </div>
    </main>
  );
}
