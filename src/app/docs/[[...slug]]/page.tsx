import { notFound } from 'next/navigation';

import type { Metadata } from 'next';
import Link from 'next/link';

interface DocPageProps {
  params: {
    slug?: string[];
  };
}

// async function getDocFromParams({ params }: DocPageProps) {
//   const slug = params.slug?.join('/') || '';
//   const doc = allDocs.find((doc) => doc.slugAsParams === slug);

//   if (!doc) {
//     return null;
//   }

//   return doc;
// }

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  if (!params.slug) {
    return {
      title: 'Documentation',
      description: 'Documentation for the project',
    };
  }

  return {
    title: 'Documentation',
    description: 'Documentation for the project',
  };
  //   const doc = await getDocFromParams({ params });

  //   if (!doc) {
  //     return {};
  //   }

  //   return {
  //     title: doc.title,
  //     description: doc.description,
  //   };
}

export default async function Page({ params }: DocPageProps) {
  if (!params.slug) {
  }

  //   const doc = await getDocFromParams({ params });

  //   if (!doc) {
  //     notFound();
  //   }

  //   const toc = await getTableOfContents(doc.body.raw);

  return (
    <main className="relative py-6 lg:gap-10 lg:py-8 px-32 xl:grid xl:grid-cols-[1fr_300px]">
      {JSON.stringify(params)}
    </main>
  );
}
