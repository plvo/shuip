'use client';

import type React from 'react';
import { TooltipProvider } from '@/components/ui-base/tooltip';

export function BaseUiProviders({ children }: { children: React.ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}
