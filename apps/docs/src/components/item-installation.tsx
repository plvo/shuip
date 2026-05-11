'use client';

import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type React from 'react';
import { CodeHighlight } from './item-preview';

export interface InstallationCmdProps extends React.RefAttributes<HTMLDivElement> {
  registryPath: string;
  manualCode?: string;
}

export function InstallationCmd({ registryPath, manualCode, ...props }: InstallationCmdProps) {
  const choices = ['npm', 'pnpm', 'bun', manualCode && 'manual'].filter(Boolean) as string[];

  const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://shuip.plvo.dev';
  const filename = registryPath.split('/').pop() || '';
  const registryUrl = `${origin}/r/${filename}.json`;

  return (
    <Tabs items={choices} className={'w-full **:data-code:px-4'} {...props}>
      <Tab>
        <CodeBlock keepBackground data-code>
          <Pre>npx shadcn@latest add {registryUrl}</Pre>
        </CodeBlock>
      </Tab>
      <Tab>
        <CodeBlock keepBackground data-code>
          <Pre>pnpm dlx shadcn@latest add {registryUrl}</Pre>
        </CodeBlock>
      </Tab>
      <Tab>
        <CodeBlock keepBackground data-code>
          <Pre>bun x shadcn@latest add {registryUrl}</Pre>
        </CodeBlock>
      </Tab>
      {manualCode && (
        <Tab>
          <CodeBlock keepBackground data-code>
            <CodeHighlight code={manualCode} language='tsx' />
          </CodeBlock>
        </Tab>
      )}
    </Tabs>
  );
}
