'use client';

import { usePathname } from 'next/navigation';
import { NavGroup, NavItem } from './nav-items';

export async function DocsNav({
  pathsByCategory,
  allPaths,
}: {
  pathsByCategory: Record<string, string[]>;
  allPaths: string[];
}) {
  const pathname = usePathname();

  return (
    <nav className='flex flex-col gap-1'>
      {Object.entries(pathsByCategory).map(([category, paths]) => (
        <NavGroup key={category} title={category}>
          {paths.map((path, index) => (
            <NavItem
              key={index}
              title={path}
              href={path}
              isActive={pathname === `/${path}`}
              data-first-index={index === 0}
              data-last-index={index === paths.length - 1}
            />
          ))}
        </NavGroup>
      ))}
    </nav>
  );
}
