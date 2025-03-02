'use client';

import { DocSidebar } from '@/components/docs/doc-sidebar';
import { Header } from '@/components/docs/header';
import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MDXProvider } from '@mdx-js/react';
import React from 'react';

const components = {
  Button,
};

export interface DocsProviderProps {
  children: React.ReactNode;
}

export default function DocsProvider({ children }: DocsProviderProps) {
  return (
    <MDXProvider components={components}>
      <SidebarProvider>
        <DocSidebar />
        <SidebarInset>
          <Header />
          <main>{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </MDXProvider>
  );
}
