'use client';

import React from 'react';
import { DocSidebar } from '@/components/docs/doc-sidebar';
import { Header } from '@/components/docs/header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export interface DocsProviderProps {
  children: React.ReactNode;
}

export default function DocsProvider({ children }: DocsProviderProps) {
  return (
    <SidebarProvider>
      <DocSidebar />
      <SidebarInset>
        <Header />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
