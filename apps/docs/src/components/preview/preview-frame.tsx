'use client';

import { Loader2Icon } from 'lucide-react';
import * as React from 'react';

export interface PreviewFrameProps {
  registryName: string;
  component: React.ComponentType | undefined;
}

export function PreviewFrame({ registryName, component: PreviewComponent }: PreviewFrameProps) {
  return (
    <div className='not-prose w-full min-h-[150px] flex items-center justify-center p-8 bg-background border border-border rounded-md'>
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
