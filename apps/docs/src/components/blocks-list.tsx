import Link from 'next/link';
import { LazyPreview } from '@/components/lazy-preview';
import { Preview } from '@/components/preview/preview';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Base } from '@/lib/base-routes';
import { blocksSources } from '@/lib/source';

export function BlocksList({ base }: { base: Base }) {
  const blocksPages = blocksSources[base].getPages().filter((page) => page.data.registryName);

  return (
    <div className='flex flex-col gap-6'>
      {blocksPages.map((page) => (
        <Card key={page.url} className='gap-0 overflow-hidden py-0 transition-shadow hover:shadow-2xl'>
          <Link href={page.url} className='no-underline'>
            <CardHeader className='py-(--card-spacing)'>
              <CardTitle>{page.data.title}</CardTitle>
              <CardDescription className='line-clamp-3'>{page.data.description}</CardDescription>
            </CardHeader>
          </Link>
          <div className='h-80 overflow-hidden border-t border-border'>
            <LazyPreview className='h-full'>
              <Preview base={base} registryName={`${page.data.registryName}.example`} />
            </LazyPreview>
          </div>
        </Card>
      ))}
    </div>
  );
}
