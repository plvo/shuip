'use client';

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '../ui/sidebar';
import { usePathname } from 'next/navigation';
import React from 'react';
import { stringToUppercase } from '@/lib/utils';

export function Header() {
  const pathname = usePathname().split('/').filter(Boolean);

  return (
    <header className="flex h-16 p-2 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="z-50" />
        <Breadcrumb>
          <BreadcrumbList>
            {pathname.map((path, index) => {
              const isLast = index === pathname.length - 1;
              return (
                <React.Fragment key={path}>
                  <BreadcrumbItem className={isLast ? 'font-bold' : ''}>{stringToUppercase(path)}</BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
