import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { blocksSource } from '@/lib/source';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function BlocksList() {
  const blocksPages = blocksSource.getPages().filter((page) => page.data.info.path !== 'index.mdx');

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
      {blocksPages.map((page) => (
        <Link
          href={page.url}
          key={page.url}
          className='no-underline hover:**:data-arrow:translate-x-1 hover:**:data-arrow:-translate-y-1'
        >
          <Card className='hover:bg-accent transition-all hover:shadow-2xl h-33'>
            <CardHeader className='relative'>
              <CardTitle>{page.data.title}</CardTitle>
              <CardDescription className='line-clamp-3'>{page.data.description}</CardDescription>
              <ArrowUpRight data-arrow className='absolute top-4 right-4 size-4 transition' />
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
