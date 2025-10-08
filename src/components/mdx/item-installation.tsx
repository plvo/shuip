'use client';

import { Terminal } from 'lucide-react';
import React from 'react';
import { CopyButton } from '@/components/ui/shuip/copy-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CodePreview } from './code-preview';

export interface InstallationCmdProps extends React.RefAttributes<HTMLDivElement> {
  registryPath: string;
  manualCode?: string;
}

export function InstallationCmd({ registryPath, manualCode, ...props }: InstallationCmdProps) {
  const [pkg, setValue] = React.useState<PackageManager>('npm');

  const code = pkg === 'manual' && manualCode ? manualCode : getCmd(pkg, registryPath.split('/').pop() || '');

  const choices = ['npm', 'pnpm', 'bun', manualCode ? 'manual' : undefined].filter(Boolean) as PackageManager[];

  return (
    <Tabs value={pkg} onValueChange={(v) => setValue(v as PackageManager)} className={'w-full rounded-lg'} {...props}>
      <TabsList className='flex justify-between p-2 bg-card'>
        <div className='px-0 py-2'>
          {choices.map((manager) => (
            <TabsTrigger
              key={manager}
              value={manager}
              className={'px-2 data-[state=active]:bg-transparent data-[state=active]:text-foreground'}
            >
              {manager}
            </TabsTrigger>
          ))}
        </div>
        <CopyButton value={code} />
      </TabsList>

      {choices.map((cmd) => (
        <TabsContent className='rounded-lg border border-secondary overflow-hidden' key={cmd} value={cmd}>
          {cmd === 'manual' && manualCode ? (
            <CodePreview onlyCode code={manualCode} />
          ) : (
            <pre className='flex items-center p-3'>
              <Terminal className='size-4 mr-2 text-muted-foreground' />
              <code className='overflow-x-auto'>{code}</code>
            </pre>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}

type PackageManager = 'npm' | 'pnpm' | 'bun' | 'manual';

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
