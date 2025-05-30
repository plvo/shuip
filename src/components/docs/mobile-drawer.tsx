'use client';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useDocuments } from '@/hooks/use-documents';
import { firstCharUppercase } from '@/lib/utils';
import { allDocuments } from 'contentlayer/generated';
import { BookOpen, Cuboid, FileText, LayoutGrid, MenuIcon, Zap } from 'lucide-react';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { NavGroup, NavItem, SubNavGroup } from './nav-items';

export function MobileDrawer() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const { documents, allComponentGroups, blocks } = useDocuments();

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
          <NavGroup title='Introduction' icon={<BookOpen className='size-4' />}>
            {documents.map((item, index) => (
              <NavItem
                key={index}
                title={item.title}
                href={`/${item.slug}`}
                isActive={pathname === `/${item.slug}`}
                onClick={() => setOpen(false)}
                data-first-index={index === 0}
                data-last-index={index === documents.length - 1}
              />
            ))}
          </NavGroup>

          <NavGroup title='Components' icon={<LayoutGrid className='size-4' />}>
            {allComponentGroups.map((group) => (
              <SubNavGroup key={group} title={firstCharUppercase(group)} icon={groupIcons[group]}>
                {allDocuments
                  .filter((doc) => doc.type === 'Components' && doc.group === group)
                  .map((item, index) => (
                    <NavItem
                      key={index}
                      title={item.title}
                      href={`/${item.slug}`}
                      isActive={pathname === `/${item.slug}`}
                      onClick={() => setOpen(false)}
                      data-first-index={index === 0}
                      data-last-index={
                        index ===
                        allDocuments.filter((doc) => doc.type === 'Components' && doc.group === group).length - 1
                      }
                    />
                  ))}
              </SubNavGroup>
            ))}
          </NavGroup>

          <NavGroup title='Blocks' icon={<Cuboid className='size-4' />}>
            {blocks.map((item, index) => (
              <NavItem
                key={index}
                title={item.title}
                href={`/${item.slug}`}
                isActive={pathname === `/${item.slug}`}
                onClick={() => setOpen(false)}
                data-first-index={index === 0}
                data-last-index={index === blocks.length - 1}
              />
            ))}
          </NavGroup>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
const groupIcons: Record<string, React.ReactNode> = {
  shortcut: <Zap className='size-4' />,
  form: <FileText className='size-4' />,
};
