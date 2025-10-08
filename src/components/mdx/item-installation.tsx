'use client';

import { Terminal } from 'lucide-react';
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CopyButton } from '../ui/shuip/copy-button';

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
