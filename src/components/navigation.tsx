'use client';

import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import type { PathsByCategory } from '@/actions/docs';
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ThemeButton } from '@/components/ui/shuip/theme-button';
import { cn, filenameToTitle } from '@/lib/utils';
import { Button } from './ui/button';

const GROUP_ORDER = ['docs', 'blocks', 'components', 'react-hook-form', 'tanstack-form'];

export function DocsSidebar({ pathsByCategory }: { pathsByCategory: PathsByCategory }) {
  return (
    <div className='md:grid md:grid-cols-[220px_minmax(0,1fr)]'>
      <aside className={'top-14 z-30 h-[calc(100vh-3.5rem)] w-full fixed hidden md:sticky md:block'}>
        <div className='h-full overflow-auto no-scrollbar py-8 px-4'>
          <nav className='flex flex-col gap-1'>
            <DocsNav pathsByCategory={pathsByCategory} />
          </nav>
        </div>
      </aside>
    </div>
  );
}

export function Header({ pathsByCategory }: { pathsByCategory: PathsByCategory }) {
  return (
    <header className={'sticky top-0 z-40 backdrop-blur-2xl h-16 flex justify-between items-center gap-4 px-4'}>
      <div className='flex items-center gap-2'>
        <Link href={'/'} passHref>
          <h1 className='text-2xl font-bold hidden md:block'>
            sh<span className='text-primary'>ui</span>p
          </h1>
        </Link>
      </div>
      <div className='flex items-center md:gap-4 gap-2'>
        <Link href={`https://github.com/plvo/shuip`} passHref>
          <Button>
            <GitHubLogoIcon className='size-4' />
            Star on GitHub
          </Button>
        </Link>
        <ThemeButton />
        <div className='md:hidden'>
          <MobileDrawer pathsByCategory={pathsByCategory} />
        </div>
      </div>
    </header>
  );
}

function MobileDrawer({ pathsByCategory }: { pathsByCategory: PathsByCategory }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant='outline' size='icon'>
          <MenuIcon className='size-4' />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className='mx-auto w-full max-w-sm px-4 py-6 overflow-y-auto'>
          <DrawerTitle asChild>
            <h1 className='text-2xl font-bold text-center mb-6'>
              sh<span className='text-primary'>ui</span>p
            </h1>
          </DrawerTitle>
          <DocsNav pathsByCategory={pathsByCategory} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function DocsNav({ pathsByCategory }: { pathsByCategory: PathsByCategory }) {
  const pathname = usePathname();

  const orderedPathsByCategory = Object.entries(pathsByCategory).sort((a, b) => {
    return GROUP_ORDER.indexOf(a[0]) - GROUP_ORDER.indexOf(b[0]);
  });

  return orderedPathsByCategory.map(([category, paths]) => {
    const needToSort = paths[0].metadata.position !== undefined;

    const handledPaths = needToSort
      ? paths.sort((a, b) => ((a.metadata.position as any) - (b.metadata.position as any)) as any)
      : paths;

    return (
      <NavGroup key={category} title={filenameToTitle(category)}>
        {handledPaths.map((content, index) => (
          <NavItem
            key={index}
            title={content.metadata.title ?? ''}
            href={content.path}
            isActive={pathname === content.path}
          />
        ))}
      </NavGroup>
    );
  });
}

interface NavGroupProps {
  title: string;
  children: React.ReactNode;
}

function NavGroup({ title, children }: NavGroupProps) {
  return (
    <div className='mb-7 space-y-2'>
      <h3 className='text-sm text-muted-foreground px-2 whitespace-nowrap'>{title}</h3>
      <ul className='space-y-2'>{children}</ul>
    </div>
  );
}

function NavItem({ title, href, isActive }: { title: string; href: string; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'text-sm font-semibold  relative flex h-8 w-full items-center rounded-md px-2 after:absolute after:inset-x-0 after:inset-y-[-2px] after:rounded-md hover:bg-accent',
        isActive ? 'bg-accent' : 'text-foreground',
      )}
    >
      {title}
    </Link>
  );
}
