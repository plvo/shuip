'use client';

import * as React from 'react';
import { ReloadIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ButtonCopy from '@/components/shared/button.copy';
import CodePreview from '@/components/shared/code-preview';
import { registryIndex } from '#/registry/__index__';

interface ComponentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  filename: string;
}

export function ComponentPreview({ filename, children, ...props }: ComponentPreviewProps) {
  const Preview = React.useMemo(() => {
    const Comp = registryIndex[filename]?.component;

    if (!Comp) {
      return (
        <p className="text-sm text-muted-foreground">
          Component <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">caca</code>{' '}
          not found in registry.
        </p>
      );
    }

    return <Comp />;
  }, []);

  const code = React.useMemo(() => {
    const codeSource = registryIndex[filename]?.code;

    if (!codeSource) {
      return null;
    }

    return codeSource;
  }, [filename]);

  return (
    <div className={cn('group relative flex flex-col space-y-2')} {...props}>
      <Tabs defaultValue="preview" className="relative mr-auto w-full">
        <div className="flex items-center justify-between pb-2">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="preview" className="table-trigger">
              Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="table-trigger">
              Code
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="preview" className="relative rounded-md border">
          <div className="flex items-center justify-between p-2 border-b">
            {/* TODO V0 */}
            <ButtonCopy value={code || ''} />
          </div>
          <div className={cn('preview w-full min-h-[150px] flex items-center justify-center p-8')}>
            <React.Suspense
              fallback={
                <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </div>
              }
            >
              {Preview}
            </React.Suspense>
          </div>
        </TabsContent>
        <TabsContent value="code">
          <CodePreview code={code || ''} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
