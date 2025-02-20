'use client';

import { DocSidebar } from '@/components/docs/sidebar';
import { Button } from '@/components/ui/button';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
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
    <SidebarProvider>
      <DocSidebar />
      <MDXProvider components={components}>
        <main>
          <SidebarTrigger />
          {children}
        </main>
      </MDXProvider>
    </SidebarProvider>
  );
}
