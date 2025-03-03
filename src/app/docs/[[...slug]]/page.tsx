import { use } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cn, stringToUppercase } from '@/lib/utils';
import { getMDXComponent } from 'next-contentlayer2/hooks';
import { allDocs } from 'contentlayer/generated';
import { MdxContent } from '@/lib/mdx-components';

interface DocPageProps {
  params: Promise<{ slug?: string[] }>;
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugPath = slug ? slug.join('/') : '';
  const doc = allDocs.find((doc) => doc.slug === slugPath);

  if (!doc) {
    return {
      title: 'Documentation introuvable',
    };
  }

  return {
    title: stringToUppercase(doc.title),
  };
}

export default function Page({ params }: DocPageProps) {
  const { slug } = use(params);
  const slugPath = slug ? slug.join('/') : '';
  const doc = allDocs.find((doc) => doc.slug === slugPath);

  if (!doc) {
    notFound();
  }

  const Content = getMDXComponent(doc.body.code);

  return (
    <div className="relative">
      <div className="space-y-2 mb-4">
        <h1 className={cn('scroll-m-20 text-3xl font-bold tracking-tight')}>{doc.title}</h1>
        {doc.description && <p className="text-base text-muted-foreground">{doc.description}</p>}
      </div>
      <MdxContent code={doc.body.code} />
    </div>
  );
}
