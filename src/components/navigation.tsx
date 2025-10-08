'use client';

import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import type { PathsByCategory } from '@/actions/docs';
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { ThemeButton } from '@/components/ui/shuip/theme-button';
import { cn, filenameToTitle } from '@/lib/utils';
import { Button } from './ui/button';

export function DocsSidebar({ pathsByCategory }: { pathsByCategory: PathsByCategory }) {
  return (
    <div className='md:grid md:grid-cols-[220px_minmax(0,1fr)]'>
      <aside className={'top-14 z-30 h-[calc(100vh-3.5rem)] w-full border-r fixed hidden md:sticky md:block'}>
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

  const groupOrder = ['docs', 'blocks', 'components', 'react-hook-form'];

  const orderedPathsByCategory = Object.entries(pathsByCategory).sort((a, b) => {
    return groupOrder.indexOf(a[0]) - groupOrder.indexOf(b[0]);
  });

  return (
    <>
      {orderedPathsByCategory.map(([category, paths]) => (
        <NavGroup key={category} title={filenameToTitle(category)}>
          {paths.map((content, index) => (
            <NavItem
              key={index}
              title={content.metadata.title ?? ''}
              href={content.path}
              isActive={pathname === content.path}
              data-first-index={index === 0}
              data-last-index={index === paths.length - 1}
            />
          ))}
        </NavGroup>
      ))}
    </>
  );
}

interface NavGroupProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function NavGroup({ title, children, icon }: NavGroupProps) {
  return (
    <div className='mb-6'>
      <h3 className='font-semibold mb-3 flex items-center gap-1.5'>
        <span className='size-4'>{icon}</span>
        {title}
      </h3>
      <ul>{children}</ul>
    </div>
  );
}

function NavItem({
  title,
  href,
  isActive,
  ...props
}: { title: string; href: string; isActive: boolean } & React.LiHTMLAttributes<HTMLLIElement>) {
  return (
    <li
      {...props}
      className={cn(
        'list-none border-l-2 ml-1.5',
        'pl-3.5 py-1.5 data-[first-index="true"]:pt-0 data-[last-index=true]:pb-0',
        isActive ? 'border-primary/60' : 'border-muted',
      )}
    >
      <Link href={href}>
        <h5 className={cn('text-sm font-semibold', isActive ? 'text-primary' : 'text-foreground')}>{title}</h5>
      </Link>
    </li>
  );
}
