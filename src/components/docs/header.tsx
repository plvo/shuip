'use client';

import { ThemeButton } from '@/components/ui/shuip/theme-button';
import { cn } from '@/lib/utils';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { Button } from '../ui/button';
import { MobileDrawer } from './mobile-drawer';

export function Header() {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 backdrop-blur-2xl border-b',
        'h-14 flex justify-between items-center gap-4 px-4',
      )}
    >
      <div className='flex items-center gap-2'>
        <Link href={'/'} passHref>
          <h1 className='text-2xl font-bold hidden md:block'>
            sh<span className='text-primary'>ui</span>p
          </h1>
        </Link>
      </div>
      <div className='flex items-center md:gap-4 gap-2'>
        <Link href={'https://github.com/plvo/shuip'} passHref>
          <Button variant='outline' size='icon'>
            <GitHubLogoIcon className='size-5' />
          </Button>
        </Link>
        <ThemeButton />
        <div className='md:hidden'>
          <MobileDrawer />
        </div>
      </div>
    </header>
  );
}
