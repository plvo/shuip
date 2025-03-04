import { use } from 'react';
import type { Metadata } from 'next';
import { cn, findDocContent, stringToUppercase } from '@/lib/utils';
import { allDocs } from 'contentlayer/generated';
import { MdxContent } from '@/components/shared/mdx-components';
import ComponentSections from '@/components/docs/component.section';
import { COMPONENT_CATEGORIES } from '#/registry/__index__';

interface DocPageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug ? slug.join('/') : '';
  const doc = allDocs.find((doc) => doc.slug === slugPath);

  if (!doc) {
    return {
      title: 'Not Found',
    };
  }

  return {
    title: stringToUppercase(doc.title),
  };
}

export default function Page({ params }: DocPageProps) {
  const { slug } = use(params);
  const slugPath = slug ? slug.join('/') : '';

  const doc = findDocContent(slugPath);
  const componentsCategory = COMPONENT_CATEGORIES[slugPath] || null;

  return (
    <div className="relative">
      {doc && (
        <>
          <div className="space-y-2 mb-4">
            <h1 className={cn('scroll-m-20 text-3xl font-bold tracking-tight')}>{doc.title}</h1>
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
  );
}
