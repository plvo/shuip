import type { Metadata } from 'next';
import { use } from 'react';

interface DocPageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export function generateMetadata({ params }: DocPageProps): Metadata {
  // const { slug } = use(params);
  // if (!slug) {
  //   return {
  //     title: 'Documentation',
  //     description: 'Documentation for the project',
  //   };
  // }

  return {
    title: 'Documentation',
    description: 'Documentation for the project',
  };
}

export default function Page({ params }: DocPageProps) {
  const { slug } = use(params);
  if (!slug) {
    <div className="relative py-6 lg:gap-10 lg:py-8 px-32 xl:grid xl:grid-cols-[1fr_300px]">
      {JSON.stringify(params)}
    </div>;
  }

  return (
    <div className="relative py-6 lg:gap-10 lg:py-8 px-32 xl:grid xl:grid-cols-[1fr_300px]">
      {JSON.stringify(params)}
    </div>
  );
}
