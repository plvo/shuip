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
          <Link href={page.url} className='no-underline'>
            <CardHeader>
              <CardTitle>{page.data.title}</CardTitle>
              <CardDescription className='line-clamp-3'>{page.data.description}</CardDescription>
            </CardHeader>
          </Link>
          <div className='h-80 overflow-hidden border-t border-border'>
            <LazyPreview registryName={`${page.data.registryName}.example`} className='h-full' />
          </div>
        </Card>
      ))}
    </div>
  );
}
