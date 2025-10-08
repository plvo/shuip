'use client';

import { Terminal } from 'lucide-react';
import React from 'react';
import { registryIndex } from '#/registry/__index__';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CopyButton } from '../ui/shuip/copy-button';
import { CodePreview } from './code-preview';

export function ItemInstallation({ registryPath }: { registryPath: string }) {
  const code = registryIndex[registryPath]?.code;

  return (
    <div className={'flex flex-col space-y-2'}>
      <Tabs defaultValue='cli' className='relative mr-auto w-full'>
        <div className='flex items-center justify-between pb-2'>
          <TabsList className='w-full justify-start rounded-none border-b bg-transparent p-0'>
            <TabsTrigger value='cli' className='table-trigger'>
              CLI
            </TabsTrigger>
            <TabsTrigger value='manual' className='table-trigger'>
              Manual
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value='cli'>
          <InstallationCmd registryPath={registryPath} />
        </TabsContent>
        <TabsContent value='manual'>
          <React.Suspense fallback={<div>Loading...</div>}>
            <p className='text-muted-foreground pb-2'>Copy the following code and paste it into your project.</p>
            {code ? (
              <CodePreview code={code} />
            ) : (
              <p className='text-sm text-muted-foreground'>Component not found in registry.</p>
            )}
          </React.Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export interface InstallationCmdProps extends React.RefAttributes<HTMLDivElement> {
  registryPath: string | string[];
}

export function InstallationCmd({ registryPath, ...props }: InstallationCmdProps) {
  const [pkg, setValue] = React.useState<PackageManager>('npm');

  const code = Array.isArray(registryPath)
    ? registryPath.map((f) => getCmd(pkg, f.split('/').pop() || '')).join('\n')
    : getCmd(pkg, registryPath.split('/').pop() || '');

  return (
    <Tabs
      value={pkg}
      onValueChange={(v) => setValue(v as PackageManager)}
      className={'w-full rounded-lg border'}
      {...props}
    >
      <TabsList className='flex justify-between p-2 bg-card'>
        <div className='px-0 py-2'>
          {['npm', 'pnpm', 'bun'].map((manager) => (
            <TabsTrigger
              key={manager}
              value={manager}
              className={cn(
                'px-2 data-[state=active]:text-primary-foreground',
                'data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:underline data-[state=active]:underline-offset-4',
              )}
            >
              {manager}
            </TabsTrigger>
          ))}
        </div>
        <CopyButton value={code} />
      </TabsList>

      {(['npm', 'pnpm', 'bun'] as PackageManager[]).map((cmd) => (
        <TabsContent className='rounded-lg mt-2 p-2' key={cmd} value={cmd}>
          <pre className='flex items-center pb-2'>
            <Terminal className='size-4 mr-2 text-muted-foreground' />
            <code className='overflow-x-auto'>{code}</code>
          </pre>
        </TabsContent>
      ))}
    </Tabs>
  );
}

type PackageManager = 'npm' | 'pnpm' | 'bun';

function getCmd(pkg: PackageManager, filename: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : process.env.URL;
  const url = `${origin}/r/${filename}.json`;

  switch (pkg) {
    case 'npm':
      return `npx shadcn@latest add ${url}`;
    case 'pnpm':
      return `pnpm dlx shadcn@latest add ${url}`;
    case 'bun':
      return `bun x shadcn@latest add ${url}`;
    default:
      return '';
  }
}
