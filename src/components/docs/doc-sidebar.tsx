'use client';

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
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { allDocs } from 'contentlayer/generated';
import { Component, Flame, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type * as React from 'react';
import { COMPONENT_CATEGORIES } from '#/registry/__index__';
import { Button } from '../ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import ButtonTheme from '../ui/shuip/button.theme';

export const DocSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname();
  const docPages = allDocs
    .filter((doc) => (doc.GettingStartedPosition ?? 0) > 0)
    .sort((a, b) => (a.GettingStartedPosition ?? 0) - (b.GettingStartedPosition ?? 0));

  return (
    <Sidebar variant='inset' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <a href='/'>
                <b className='text-3xl'>
                  sh<span className='text-primary'>ui</span>p
                </b>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className='text-primary'>
            <Flame className='mr-1.5 size-5' />
            Getting Started
          </SidebarGroupLabel>
          <SidebarMenu>
            {docPages.map((item, i) => {
              const path = `/docs${item.slug ? `/${item.slug}` : ''}`;
              return (
                <SidebarMenuItem key={i}>
                  <SidebarMenuButton asChild isActive={pathname === path}>
                    <a href={path}>{item.title}</a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className='text-primary'>
            <Component className='mr-1.5 size-5' />
            Components
          </SidebarGroupLabel>
          <SidebarMenu>
            {Object.entries(COMPONENT_CATEGORIES).map(([group, components], i) => {
              const pathPage = `/docs/${group}`;
              const isGroupePage = pathname === pathPage;
              const isGroupPathActive = pathname.startsWith(pathPage);

              return (
                <SidebarMenuItem key={i}>
                  <Collapsible className='group/collapsible' defaultOpen={isGroupPathActive}>
                    <CollapsibleTrigger asChild>
                      <a href={`/docs/${group}`}>
                        <SidebarMenuButton isActive={isGroupePage}>
                          {stringToUppercase(group)}
                          <Plus className='ml-auto group-data-[state=open]/collapsible:hidden' />
                          <Minus className='ml-auto group-data-[state=closed]/collapsible:hidden' />
                        </SidebarMenuButton>
                      </a>
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
          <Button className='w-full cursor-pointer' variant={'outline'}>
            <GitHubLogoIcon className='size-5' />
            Github
          </Button>
        </Link>
        <ButtonTheme withText />
      </SidebarFooter>
    </Sidebar>
  );
};
