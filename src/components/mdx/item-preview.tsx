'use client';

import { CodePreview } from '@/components/mdx/code-preview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ReloadIcon } from '@radix-ui/react-icons';
import * as React from 'react';
import { registryIndex } from '#/registry/__index__';
import { CopyButton } from '../ui/shuip/copy-button';

export interface ItemPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  filename: string;
}

export function ItemPreview({ filename, children, ...props }: ItemPreviewProps) {
  const code = React.useMemo(() => {
    const codeSource = registryIndex[filename]?.code;

    if (!codeSource) {
      return null;
    }

    return codeSource;
  }, [filename]);

  return (
    <div className={cn('flex flex-col space-y-2')} {...props}>
      <Tabs defaultValue='preview' className='relative mr-auto w-full'>
        <div className='flex items-center justify-between pb-2'>
          <TabsList className='w-full justify-start rounded-none border-b bg-transparent p-0'>
            <TabsTrigger value='preview' className='table-trigger'>
              Preview
            </TabsTrigger>
            <TabsTrigger value='code' className='table-trigger'>
              Code
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value='preview' className='relative rounded-md border'>
          <div className='flex items-center justify-between p-2 border-b'>
            {/* TODO V0 */}
            <CopyButton value={code || ''} />
          </div>
          <Preview filename={filename} isJustPreview={false} />
        </TabsContent>
        <TabsContent value='code'>
          <CodePreview code={code || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function Preview({ filename, isJustPreview = true }: { filename: string; isJustPreview?: boolean }) {
  const Preview = React.useMemo(() => {
    const Comp = registryIndex[filename]?.component;

    if (!Comp) {
      return (
        <p className='text-sm text-muted-foreground'>
          Component{' '}
          <code className='relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm'>{filename}</code> not
          found in registry.
        </p>
      );
    }

    return <Comp />;
  }, [filename]);

  return (
    <div
      className={cn(
        'w-full min-h-[150px] flex items-center justify-center p-8 bg-card',
        isJustPreview && 'border rounded-md',
      )}
    >
      <React.Suspense
        fallback={
          <div className='flex w-full items-center justify-center text-sm text-muted-foreground'>
            <ReloadIcon className='mr-2 h-4 w-4 animate-spin' />
            Loading...
          </div>
        }
      >
        {Preview}
      </React.Suspense>
    </div>
  );
}
