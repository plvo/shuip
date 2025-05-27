'use client';

import { cn } from '@/lib/utils';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import Link from 'next/link';

export function Header() {
  return (
    <header
      className={cn('sticky top-0 z-50 backdrop-blur-2xl border', 'h-14 flex justify-between items-center gap-4 px-4')}
    >
      <div className='flex items-center gap-2'>
        <h1 className='text-2xl font-bold'>sh(ui)p</h1>
      </div>
      <Link href={'https://github.com/plvo/shuip'} passHref>
        <GitHubLogoIcon className='size-5' />
      </Link>
    </header>
  );
}
