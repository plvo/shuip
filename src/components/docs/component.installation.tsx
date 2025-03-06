'use client';

import React from 'react';
import { Terminal } from 'lucide-react';
import ButtonCopy from '../shared/button.copy';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import CodePreview from '../shared/code-preview';

type PackageManager = 'npm' | 'pnpm' | 'bun' | 'yarn';

interface ComponentInstallationProps {
  filename: string;
}

export default function ComponentInstallation({ filename }: ComponentInstallationProps) {
  return (
    <div className={cn('group relative flex flex-col space-y-2')}>
      <Tabs defaultValue="cli" className="relative mr-auto w-full">
        <div className="flex items-center justify-between pb-2">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger value="cli" className="table-trigger">
              CLI
            </TabsTrigger>
            <TabsTrigger value="manual" className="table-trigger">
              Manual
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="cli">
          <InstallationCmd filename={filename} />
        </TabsContent>
        <TabsContent value="manual">
          <p className="text-muted-foreground pb-2">Copy the following code and paste it into your project.</p>
          <CodePreview filename={filename} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function InstallationCmd({ filename }: { filename: string }) {
  const [value, setValue] = React.useState<PackageManager>('npm');
  const url = `https://shuip.xyz/r/${filename}.json`;

  const getCmd = (value: PackageManager) => {
    switch (value) {
      case 'npm':
        return `npx shadcn@latest add ${url}`;
      case 'pnpm':
        return `pnpm dlx shadcn@latest add ${url}`;
      case 'bun':
        return `bunx --bun shadcn@latest add ${url}`;
      case 'yarn':
        return `npx shadcn@latest add ${url}`;
      default:
        return '';
    }
  };

  const CmdCode: React.FC = () => (
    <pre className="flex items-center">
      <Terminal className="size-4 mr-2 mt-0.5 text-muted-foreground" />
      <code>{getCmd(value)}</code>
    </pre>
  );

  return (
    <Tabs value={value} onValueChange={(v) => setValue(v as PackageManager)} className="w-full">
      <TabsList className="flex justify-between p-2 bg-muted/70">
        <div className="px-0 py-2">
          {(['npm', 'pnpm', 'bun', 'yarn'] as PackageManager[]).map((manager) => (
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
        <ButtonCopy value={getCmd(value)} />
      </TabsList>

      {(['npm', 'pnpm', 'bun', 'yarn'] as PackageManager[]).map((cmd) => (
        <TabsContent className="rounded-lg mt-2 p-2" key={cmd} value={cmd}>
          <CmdCode />
        </TabsContent>
      ))}
    </Tabs>
  );
}
