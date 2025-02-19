import type { Metadata } from 'next';
import { use } from 'react';

interface DocPageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  if (!use(params).slug) {
    return {
      title: 'Documentation',
      description: 'Documentation for the project',
    };
  }

  return {
    title: 'Documentation',
    description: 'Documentation for the project',
  };
}

export default async function Page({ params }: DocPageProps) {
  if (!use(params).slug) {
    <main className="relative py-6 lg:gap-10 lg:py-8 px-32 xl:grid xl:grid-cols-[1fr_300px]">
      {JSON.stringify(params)}
    </main>;
  }

  return (
    <main className="relative py-6 lg:gap-10 lg:py-8 px-32 xl:grid xl:grid-cols-[1fr_300px]">
      {JSON.stringify(params)}
    </main>
  );
}
