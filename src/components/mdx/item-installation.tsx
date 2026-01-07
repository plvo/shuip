'use client';

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
    <Tabs value={pkg} onValueChange={(v) => setValue(v as PackageManager)} className={'w-full'} {...props}>
      <TabsList className='flex justify-between bg-card rounded-b-none -mb-4 pt-0 pb-4 h-12 border border-border'>
        <div className='px-0'>
          {choices.map((manager) => (
            <TabsTrigger
              key={manager}
              value={manager}
              className={'tabs-trigger-mdx cursor-pointer'}
              aria-label={manager}
            >
              {manager}
            </TabsTrigger>
          ))}
        </div>
        <CopyButton value={code} className='r-2' />
      </TabsList>

      {choices.map((cmd) => (
        <TabsContent key={cmd} value={cmd} className='rounded-md border border-border overflow-hidden w-full p-0 m-0'>
          <CodePreview {...(cmd === 'manual' && manualCode ? { code: manualCode } : { code, language: 'bash' })} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

type PackageManager = 'npm' | 'pnpm' | 'bun' | 'manual';

function getCmd(pkg: PackageManager, filename: string): string {
  const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://shuip.plvo.dev';
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
