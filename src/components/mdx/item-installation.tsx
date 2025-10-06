'use client';

import { Terminal } from 'lucide-react';
import { usePathname } from 'next/navigation';
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { CopyButton } from '../ui/shuip/copy-button';
import { CodePreview } from './code-preview';

export interface ItemInstallationProps {
  filename: string;
}

export function ItemInstallation({ filename }: ItemInstallationProps) {
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
          <InstallationCmd filename={filename} />
        </TabsContent>
        <TabsContent value='manual'>
          <p className='text-muted-foreground pb-2'>Copy the following code and paste it into your project.</p>
          <CodePreview filename={filename} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export interface InstallationCmdProps extends React.RefAttributes<HTMLDivElement> {
  filename: string | string[];
}

export function InstallationCmd({ filename, ...props }: InstallationCmdProps) {
  const [pkg, setValue] = React.useState<PackageManager>('npm');

  const code = Array.isArray(filename) ? filename.map((f) => getCmd(pkg, f)).join('\n') : getCmd(pkg, filename);

  const CmdCode: React.FC = () => (
    <pre className='flex items-center pb-2'>
      <Terminal className='size-4 mr-2 text-muted-foreground' />
      <code className='overflow-x-auto'>{code}</code>
    </pre>
  );

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

      {(['npm', 'pnpm', 'bun', 'yarn'] as PackageManager[]).map((cmd) => (
        <TabsContent className='rounded-lg mt-2 p-2' key={cmd} value={cmd}>
          <CmdCode />
        </TabsContent>
      ))}
    </Tabs>
  );
}

type PackageManager = 'npm' | 'pnpm' | 'bun';

const getCmd = (pkg: PackageManager, filename: string) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://shuip.xyz';
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
};
