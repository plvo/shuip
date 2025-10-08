'use client';

import { ReloadIcon } from '@radix-ui/react-icons';
import * as React from 'react';
import { getContentByFilePath } from '@/actions/docs';
import { CodePreview } from '@/components/mdx/code-preview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CopyButton } from '../ui/shuip/copy-button';

export interface ItemPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  registryPath: string;
}

export function ItemPreview({ registryPath, ...props }: ItemPreviewProps) {
  const code = React.useMemo(() => {
    const codeSource = getContentByFilePath(registryPath);

    if (!codeSource) {
      return null;
    }

    return codeSource;
  }, [registryPath]);

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
            <CopyButton value={code || ''} />
          </div>
          <Preview registryPath={registryPath} isJustPreview={false} />
        </TabsContent>
        <TabsContent value='code'>
          <CodePreview code={code || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function Preview({ registryPath, isJustPreview = true }: { registryPath: string; isJustPreview?: boolean }) {
  return <div>Preview</div>;
  // const Preview: React.JSX.Element = React.useMemo(() => {
  //   const Comp = React.lazy(async () => {
  //     const mod = await import(`${registryPath}`);
  //     const exportName =
  //       Object.keys(mod).find((key) => typeof mod[key] === 'function' || typeof mod[key] === 'object') || registryPath;
  //     return { default: mod.default || mod[exportName] };
  //   });

  //   if (!Comp) {
  //     return (
  //       <p className='text-sm text-muted-foreground'>
  //         Component{' '}
  //         <code className='relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm'>{registryPath}</code>{' '}
  //         not found in registry.
  //       </p>
  //     );
  //   }

  //   return <Comp />;
  // }, [registryPath]);

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
            <ReloadIcon className='mr-2 size-4 animate-spin' />
            Loading...
          </div>
        }
      >
        {Preview}
      </React.Suspense>
    </div>
  );
}
