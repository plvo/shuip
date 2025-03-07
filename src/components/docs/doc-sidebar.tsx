'use client';

import * as React from 'react';
import { Component, Flame, Minus, Plus } from 'lucide-react';
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { filenameToTitle, stringToUppercase } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import ButtonTheme from '../ui/shuip/button.theme';
import { COMPONENT_CATEGORIES } from '#/registry/__index__';
import Link from 'next/link';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

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
              <a href="/docs">
                <b className="text-3xl">
                  sh<span className="text-amber-400">ui</span>p
                </b>
              </a>
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
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <a href={item.href}>{item.title}</a>
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
            {Object.entries(COMPONENT_CATEGORIES).map(([group, components], i) => {
              const pathPage = `/docs/${group}`;
              const isGroupePage = pathname === pathPage;
              const isGroupPathActive = pathname.startsWith(pathPage);

              return (
                <SidebarMenuItem key={i}>
                  <Collapsible className="group/collapsible" defaultOpen={isGroupPathActive}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isGroupePage}>
                        <a href={`/docs/${group}`} className="hover:underline underline-offset-4">
                          {stringToUppercase(group)}
                        </a>
                        <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                        <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {Object.keys(components).map((c, i) => {
                          return (
                            <SidebarMenuSubItem key={i}>
                              <SidebarMenuSubButton asChild isActive={pathname === `${pathPage}/${c}`}>
                                <a href={`${pathPage}/${c}`}>{filenameToTitle(c)}</a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Link href={'https://github.com/plvo/shuip'} passHref>
          <Button className="w-full cursor-pointer" variant={'outline'}>
            <GitHubLogoIcon className="size-5" />
            Github
          </Button>
        </Link>
        <ButtonTheme withText />
      </SidebarFooter>
    </Sidebar>
  );
};
