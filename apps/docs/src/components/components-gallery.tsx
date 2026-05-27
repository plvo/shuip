import Link from 'next/link';
import { LazyPreview } from '@/components/lazy-preview';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { componentsSource } from '@/lib/source';

const CATEGORY_ORDER = ['components', 'react-hook-form', 'tanstack-form', 'tanstack-query'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  components: 'Components',
  'react-hook-form': 'React Hook Form',
  'tanstack-form': 'Tanstack Form',
  'tanstack-query': 'Tanstack Query',
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
      {CATEGORY_ORDER.filter((category) => byCategory.has(category)).map((category) => (
        <section key={category} className='space-y-6'>
          <h2 className='font-mono text-2xl font-bold'>{CATEGORY_LABELS[category]}</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {byCategory.get(category)?.map((page) => (
              <Link href={page.url} key={page.url} className='no-underline'>
                <Card className='overflow-hidden transition-all hover:bg-accent hover:shadow-2xl'>
                  <div className='pointer-events-none flex h-40 items-center justify-center overflow-hidden border-b border-border'>
                    <LazyPreview registryName={`${page.data.registryName}.example`} className='w-full' />
                  </div>
                  <CardHeader>
                    <CardTitle>{page.data.title}</CardTitle>
                    <CardDescription className='line-clamp-2'>{page.data.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
