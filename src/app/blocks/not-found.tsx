import { DocsPage } from 'fumadocs-ui/page';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <DocsPage full>
      <div className='flex min-h-[60vh] w-full flex-col items-center justify-center px-4 text-center'>
        <div className='space-y-6'>
          <div className='space-y-2'>
            <h1 className='font-mono text-6xl font-bold text-foreground'>404</h1>
            <h2 className='text-2xl font-semibold text-foreground'>Page Not Found</h2>
            <p className='text-muted-foreground'>The page you're looking for doesn't exist in the blocks section.</p>
          </div>
          <Button asChild variant='default' size='lg'>
            <Link href='/blocks'>Go back to Blocks</Link>
          </Button>
        </div>
      </div>
    </DocsPage>
  );
}
