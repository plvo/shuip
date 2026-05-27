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
        <Card key={page.url} className='overflow-hidden transition-all hover:shadow-2xl'>
          <CardHeader>
            <CardTitle>
              <Link href={page.url} className='group inline-flex items-center gap-1 hover:underline'>
                {page.data.title}
                <ArrowUpRight className='size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5' />
              </Link>
            </CardTitle>
            <CardDescription className='line-clamp-3'>{page.data.description}</CardDescription>
          </CardHeader>
          <div className='h-80 overflow-hidden border-t border-border'>
            <LazyPreview registryName={`${page.data.registryName}.example`} className='h-full' />
          </div>
        </Card>
      ))}
    </div>
  );
}
