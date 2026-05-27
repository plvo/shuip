import Link from 'next/link';
import { LazyPreview } from '@/components/lazy-preview';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { componentsSource } from '@/lib/source';

const CATEGORY_ORDER = ['components', 'react-hook-form', 'tanstack-form', 'tanstack-query'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  components: 'Components',
  'react-hook-form': 'React Hook Form',
  'tanstack-form': 'TanStack Form',
  'tanstack-query': 'TanStack Query',
};

const CATEGORY_GUIDES: Record<string, string | undefined> = {
  'react-hook-form': '/components/react-hook-form',
  'tanstack-form': '/components/tanstack-form',
  'tanstack-query': '/components/tanstack-query',
};

export function ComponentsGallery() {
  const pages = componentsSource.getPages().filter((page) => page.data.registryName);

  const byCategory = new Map<string, typeof pages>();
  for (const page of pages) {
    const category = page.slugs[0];
    if (!category) continue;
    const list = byCategory.get(category) ?? [];
    list.push(page);
    byCategory.set(category, list);
  }

  return (
    <div className='space-y-12'>
      {CATEGORY_ORDER.filter((category) => byCategory.has(category)).map((category) => {
        const guide = CATEGORY_GUIDES[category];
        return (
          <section key={category} className='space-y-6'>
            <h2 className='font-mono text-2xl font-bold'>
              {guide ? (
                <Link href={guide} className='hover:underline'>
                  {CATEGORY_LABELS[category]}
                </Link>
              ) : (
                CATEGORY_LABELS[category]
              )}
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {byCategory.get(category)?.map((page) => (
                <Card key={page.url} className='overflow-hidden transition-all hover:shadow-2xl'>
                  <div className='flex h-40 items-center justify-center overflow-hidden border-b border-border'>
                    <LazyPreview registryName={`${page.data.registryName}.example`} className='w-full' />
                  </div>
                  <CardHeader>
                    <CardTitle>
                      <Link href={page.url} className='hover:underline'>
                        {page.data.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className='line-clamp-2'>{page.data.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
