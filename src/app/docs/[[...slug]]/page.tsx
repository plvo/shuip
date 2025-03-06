import type { Metadata } from 'next';
import { stringToUppercase } from '@/lib/utils';
import { MdxContent } from '@/components/shared/mdx-components';
import ComponentSections from '@/components/docs/component.section';
import { COMPONENT_CATEGORIES } from '#/registry/__index__';
import { getTableOfContents } from '@/lib/toc';
import { allDocs } from 'contentlayer/generated';
import { SidebarTableOfContents } from '@/components/docs/toc';

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
  if (slug.length < 2) {
    return { component: null, examples: [] };
  }
  const [group, componentName] = slug;
  const examples = COMPONENT_CATEGORIES[group][componentName] || null;

  return { componentName, examples };
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
  const { componentName, examples } = getComponentFromSlug(slugArray);

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

        {componentName && <ComponentSections componentName={componentName} examples={examples} />}
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
