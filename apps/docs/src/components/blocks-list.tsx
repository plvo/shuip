import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { LazyPreview } from '@/components/lazy-preview';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { blocksSource } from '@/lib/source';

export function BlocksList() {
  const blocksPages = blocksSource.getPages().filter((page) => page.data.registryName);

  return (
    <div className='flex flex-col gap-6'>
      {blocksPages.map((page) => (
        <Link
          href={page.url}
          key={page.url}
          className='no-underline hover:**:data-arrow:translate-x-1 hover:**:data-arrow:-translate-y-1'
        >
          <Card className='overflow-hidden transition-all hover:bg-accent hover:shadow-2xl'>
            <CardHeader className='relative'>
              <CardTitle>{page.data.title}</CardTitle>
              <CardDescription className='line-clamp-3'>{page.data.description}</CardDescription>
              <ArrowUpRight data-arrow className='absolute top-4 right-4 size-4 transition' />
            </CardHeader>
            <div className='pointer-events-none h-80 overflow-hidden border-t border-border'>
              <LazyPreview registryName={`${page.data.registryName}.example`} className='h-full' />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
