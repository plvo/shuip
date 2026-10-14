import Link from 'next/link';
import { LazyPreview } from '@/components/lazy-preview';
import { Preview } from '@/components/preview';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type Base, sectionUrl } from '@/lib/base-routes';
import { componentsSources } from '@/lib/source';

const CATEGORY_ORDER = ['components', 'react-hook-form', 'tanstack-form', 'tanstack-query'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  components: 'Components',
  'react-hook-form': 'React Hook Form',
  'tanstack-form': 'TanStack Form',
  'tanstack-query': 'TanStack Query',
};

const GUIDED_CATEGORIES = ['react-hook-form', 'tanstack-form', 'tanstack-query'];

export function ComponentsGallery({ base }: { base: Base }) {
  const pages = componentsSources[base].getPages().filter((page) => page.data.registryName);

  const byCategory = new Map<string, typeof pages>();
  for (const page of pages) {
    const category = page.slugs.length === 1 ? 'components' : page.slugs[0];
    if (!category) continue;
    const list = byCategory.get(category) ?? [];
    list.push(page);
    byCategory.set(category, list);
  }

  return (
    <div className='space-y-12'>
      {CATEGORY_ORDER.filter((category) => byCategory.has(category)).map((category) => {
        const guide = GUIDED_CATEGORIES.includes(category) ? sectionUrl('components', base, [category]) : undefined;
        return (
          <section key={category} className='space-y-6'>
            <h2 className='font-mono text-2xl font-bold'>
              {guide ? (
                <Link href={guide} className='no-underline'>
                  {CATEGORY_LABELS[category]}
                </Link>
              ) : (
                CATEGORY_LABELS[category]
              )}
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {byCategory.get(category)?.map((page) => (
                <Card key={page.url} className='gap-0 overflow-hidden py-0 transition-shadow hover:shadow-2xl'>
                  <div className='flex h-40 items-center justify-center overflow-hidden border-b border-border'>
                    <LazyPreview className='w-full'>
                      <Preview base={base} registryName={`${page.data.registryName}.example`} />
                    </LazyPreview>
                  </div>
                  <Link href={page.url} className='no-underline'>
                    <CardHeader className='py-(--card-spacing)'>
                      <CardTitle>{page.data.title}</CardTitle>
                      <CardDescription className='line-clamp-2'>{page.data.description}</CardDescription>
                    </CardHeader>
                  </Link>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
