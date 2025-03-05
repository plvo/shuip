'use client';

import * as React from 'react';
import { Component, Flame } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn, stringToUppercase } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import ButtonTheme from '../ui/shuip/button.theme';
import { COMPONENT_CATEGORIES } from '#/registry/__index__';

const dataGettingStarted = [
  {
    title: 'Introduction',
    href: '/docs',
  },
  {
    title: 'Installation',
    href: '/docs/installation',
  },
  {
    title: 'Configuration',
    href: '/docs/configuration',
  },
];

export const DocSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/docs">shuip docs</a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Flame className="mr-1 size-5" />
            Getting Started
          </SidebarGroupLabel>
          <SidebarMenu>
            {dataGettingStarted.map((item, i) => {
              return (
                <SidebarMenuItem key={i}>
                  <SidebarMenuButton asChild>
                    <a href={item.href} className={cn('hover:bg-muted', 'hover:font-bold')}>
                      {item.title}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <Component className="mr-1 size-5" />
            Components
          </SidebarGroupLabel>
          <SidebarMenu>
            {Object.entries(COMPONENT_CATEGORIES).map(([group], i) => {
              const pathPage = `/docs/${group}`;
              const isPathActive = pathname === pathPage;

              return (
                <SidebarMenuItem key={i}>
                  <SidebarMenuButton asChild>
                    <a href={pathPage} className={cn(isPathActive ? 'bg-muted font-bold' : '')}>
                      <span>{stringToUppercase(group)}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        v1.0.0
        <ButtonTheme withText />
      </SidebarFooter>
    </Sidebar>
  );
};
