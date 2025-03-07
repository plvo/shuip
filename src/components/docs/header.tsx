'use client';

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { SidebarTrigger } from '../ui/sidebar';
import { usePathname } from 'next/navigation';
import React from 'react';
import { cn, stringToUppercase } from '@/lib/utils';
import Link from 'next/link';
import { GitHubLogoIcon } from '@radix-ui/react-icons';

export function Header() {
  const pathname = usePathname().split('/').filter(Boolean);

  return (
    <header
      className={cn(
        'h-16 w-full flex max-md:justify-between items-center gap-2 p-2 mb-4 border-b',
        'shrink-0 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12',
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="z-50" />
        <Breadcrumb>
          <BreadcrumbList>
            {pathname.map((path, index) => {
              const isLast = index === pathname.length - 1;
              const href = `/${pathname.slice(0, index + 1).join('/')}`;

              return (
                <React.Fragment key={path}>
                  <Link href={href} className="flex items-center gap-2 underline-offset-4 hover:underline">
                    <BreadcrumbItem className={isLast ? 'font-bold' : ''}>{stringToUppercase(path)}</BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </Link>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <Link href={'https://github.com/plvo/shuip'} passHref className="lg:hidden">
        <GitHubLogoIcon className="size-5" />
      </Link>
    </header>
  );
}
