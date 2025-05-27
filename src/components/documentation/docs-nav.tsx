'use client';

import { useDocuments } from '@/hooks/use-documents';
import { firstCharUppercase } from '@/lib/utils';
import { allDocuments } from 'contentlayer/generated';
import { BookOpen, Cuboid, FileText, LayoutGrid, Zap } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { NavGroup, NavItem, SubNavGroup } from '../shared/nav-items';

export function DocsNav() {
  const pathname = usePathname();
  const { documents, allComponentGroups, blocks } = useDocuments();

  return (
    <nav className='flex flex-col gap-1'>
      <NavGroup title='Introduction' icon={<BookOpen className='size-4' />}>
        {documents.map((item, index) => (
          <NavItem
            key={index}
            title={item.title}
            href={`/${item.slug}`}
            isActive={pathname === `/${item.slug}`}
            data-first-index={index === 0}
            data-last-index={index === documents.length - 1}
          />
        ))}
      </NavGroup>

      <NavGroup title='Components' icon={<LayoutGrid className='size-4' />}>
        {allComponentGroups.map((group) => (
          <SubNavGroup key={group} title={firstCharUppercase(group)} icon={groupIcons[group]}>
            {allDocuments
              .filter((doc) => doc.type === 'Component' && doc.group === group)
              .map((item, index) => (
                <NavItem
                  key={index}
                  title={item.title}
                  href={`/${item.slug}`}
                  isActive={pathname === `/${item.slug}`}
                  data-first-index={index === 0}
                  data-last-index={
                    index === allDocuments.filter((doc) => doc.type === 'Component' && doc.group === group).length - 1
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
            data-first-index={index === 0}
            data-last-index={index === blocks.length - 1}
          />
        ))}
      </NavGroup>
    </nav>
  );
}

const groupIcons: Record<string, React.ReactNode> = {
  shortcut: <Zap className='size-4' />,
  form: <FileText className='size-4' />,
};
