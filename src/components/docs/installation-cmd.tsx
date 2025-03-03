'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

type ValueCmd = 'npm' | 'pnpm' | 'bun' | 'yarn';

export default function InstallationCmd({ name }: { name: string }) {
  const [value, setValue] = React.useState<ValueCmd>('npm');

  const url = `https://shuip.xyz/r/${name}.json`;

  const CmdCode = () => {
    const cmd = (() => {
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
    })();

    return (
      <pre>
        <code>{cmd}</code>
      </pre>
    );
  };

  return (
    <Tabs
      value={value}
      onValueChange={(v) => setValue(v as ValueCmd)}
      className="relative bg-foreground/5 w-fit p-2 rounded-xl"
    >
      <TabsList>
        <TabsTrigger value="npm">npm</TabsTrigger>
        <TabsTrigger value="pnpm">pnpm</TabsTrigger>
        <TabsTrigger value="bun">bun</TabsTrigger>
        <TabsTrigger value="yarn">yarn</TabsTrigger>
      </TabsList>
      <TabsContent value="npm">
        <CmdCode />
      </TabsContent>
      <TabsContent value="pnpm">
        <CmdCode />
      </TabsContent>
      <TabsContent value="bun">
        <CmdCode />
      </TabsContent>
      <TabsContent value="yarn">
        <CmdCode />
      </TabsContent>
    </Tabs>
  );
}
