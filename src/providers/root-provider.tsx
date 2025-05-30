'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';
import type React from 'react';

export interface DocsProviderProps extends ThemeProviderProps {
  children: React.ReactNode;
}

export default function RootProvider({ children, ...props }: DocsProviderProps) {
  return (
    <NextThemesProvider enableSystem defaultTheme='system' attribute={'class'} {...props}>
      {children}
    </NextThemesProvider>
  );
}
