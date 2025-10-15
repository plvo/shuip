'use client';

import { ReloadIcon } from '@radix-ui/react-icons';
import * as React from 'react';
import { REGISTRY_INDEX } from '#/registry/__index__';
import { CodePreview } from '@/components/mdx/code-preview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CopyButton } from '../ui/shuip/copy-button';

export interface ItemPreviewProps {
  registryName: string;
}

export function ItemPreview({ registryName }: ItemPreviewProps) {
  const code = REGISTRY_INDEX[registryName]?.code;
  return (
    <Tabs defaultValue='preview'>
      <article className='rounded-lg'>
        <TabsList className='flex justify-between p-2 bg-accent'>
          <div className='px-0 py-2'>
            <TabsTrigger value='preview' className='tabs-trigger-mdx'>
              Preview
            </TabsTrigger>
            <TabsTrigger value='code' className='tabs-trigger-mdx'>
              Code
            </TabsTrigger>
          </div>
          <CopyButton value={code || ''} className='r-2' />
        </TabsList>

        <TabsContent value='preview'>
          <Preview registryName={registryName} />
        </TabsContent>
        <TabsContent value='code' className='rounded-md border border-border overflow-hidden'>
          <CodePreview code={code || ''} />
        </TabsContent>
      </article>
    </Tabs>
  );
}

export function Preview({ registryName }: { registryName: string }) {
  const PreviewComponent = React.useMemo(() => {
    const Comp = REGISTRY_INDEX[registryName]?.component;

    if (!Comp) {
      return () => (
        <p className='text-sm text-muted-foreground'>
          Component{' '}
          <code className='relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm'>{registryName}</code>{' '}
          not found in registry.
        </p>
      );
    }

    return Comp;
  }, [registryName]);

  return (
    <div className='w-full min-h-[150px] flex items-center justify-center p-8 bg-card border border-border rounded-md'>
      <React.Suspense
        fallback={
          <div className='flex w-full items-center justify-center text-sm text-muted-foreground'>
            <ReloadIcon className='mr-2 size-4 animate-spin' />
            Loading...
          </div>
        }
      >
        <PreviewComponent />
      </React.Suspense>
    </div>
  );
}
