'use client';

import * as React from 'react';
// import fs from 'fs';
import { cn } from '@/lib/utils';
// import { useConfig } from '@/hooks/use-config';
// import { CopyButton } from '@/components/copy-button';
// import { Icons } from '@/components/icons';
// import { StyleSwitcher } from '@/components/style-switcher';
// import { ThemeWrapper } from '@/components/theme-wrapper';
// import { V0Button } from '@/components/v0-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ButtonCopy from '../shared/button.copy';
import { registryIndex } from '#/registry/__index__';
import CodePreview from '../shared/code-preview';

interface ComponentPreviewProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  extractClassname?: boolean;
  extractedClassNames?: string;
  align?: 'center' | 'start' | 'end';
  description?: string;
  type?: 'block' | 'component' | 'example';
}

export function ComponentPreview({
  name,
  type,
  children,
  className,
  extractClassname,
  extractedClassNames,
  align = 'center',
  description,
  ...props
}: ComponentPreviewProps) {
  //   const [config] = useConfig();

  const Preview = React.useMemo(() => {
    const Comp = registryIndex[name]?.component;

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

  return (
    <div className={cn('group relative my-4 flex flex-col space-y-2', className)} {...props}>
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
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              {/* {description ? <V0Button name={name} /> : null} */}
              {/* <ButtonCopy
                value={'azdaz'}
                className="h-7 w-7 text-foreground opacity-100 hover:bg-muted hover:text-foreground [&_svg]:h-3.5 [&_svg]:w-3.5"
              /> */}
            </div>
          </div>
          <div
            className={cn('preview flex min-h-[300px] w-full justify-center p-8', {
              'items-center': align === 'center',
              'items-start': align === 'start',
              'items-end': align === 'end',
            })}
          >
            <React.Suspense
              fallback={
                <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
                  {/* <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> */}
                  Loading...
                </div>
              }
            >
              {Preview}
            </React.Suspense>
          </div>
        </TabsContent>
        <TabsContent value="code">
          <CodePreview filename={name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
