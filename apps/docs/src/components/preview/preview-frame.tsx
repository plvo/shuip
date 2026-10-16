'use client';

import { Loader2Icon } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface PreviewFrameProps {
  registryName: string;
  component: React.ComponentType | undefined;
  className?: string;
}

export function PreviewFrame({ registryName, component: PreviewComponent, className }: PreviewFrameProps) {
  return (
    <div
      className={cn(
        'not-prose w-full min-h-[150px] flex items-center justify-center-safe overflow-x-auto p-8 bg-background border border-border rounded-md',
        className,
      )}
    >
      {PreviewComponent ? (
        <React.Suspense
          fallback={
            <div className='flex w-full items-center justify-center text-sm text-muted-foreground'>
              <Loader2Icon className='mr-2 size-4 animate-spin' />
              Loading...
            </div>
          }
        >
          <PreviewComponent />
        </React.Suspense>
      ) : (
        <p className='text-sm text-muted-foreground'>
          Component{' '}
          <code className='relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm'>{registryName}</code>{' '}
          not found in registry.
        </p>
      )}
    </div>
  );
}
