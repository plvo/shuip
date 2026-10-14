'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';
import type React from 'react';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

export interface AppProviderProps extends ThemeProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children, ...props }: AppProviderProps) {
  return (
    <NextThemesProvider enableSystem defaultTheme='system' attribute={'class'} {...props}>
      <TooltipProvider>{children}</TooltipProvider>
      <Toaster richColors />
    </NextThemesProvider>
  );
}
