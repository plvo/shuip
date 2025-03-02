import { use } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { stringToUppercase } from '@/lib/utils';
import { getMDXComponent } from 'next-contentlayer2/hooks';
import { allDocs } from 'contentlayer/generated';

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
    <div className=" bg-red-500 relative">
      <h1>{doc.title}</h1>
      <Content />
    </div>
  );
}
