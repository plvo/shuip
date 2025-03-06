'use client';

import React from 'react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

export interface DocsProviderProps extends ThemeProviderProps {
  children: React.ReactNode;
}

export default function RootProvider({ children, ...props }: DocsProviderProps) {
  return (
    <NextThemesProvider enableSystem defaultTheme="system" {...props}>
      {children}
    </NextThemesProvider>
  );
}
