'use client';

import { SHUIP_NAMESPACE, SHUIP_REGISTRY_URL, shuipItemRef } from '@repo/registry/namespace';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import Link from 'next/link';
import type React from 'react';
import { CodeHighlight } from './item-preview';

export interface InstallationCmdProps extends React.RefAttributes<HTMLDivElement> {
  itemName: string;
  manualCode?: string;
}

export function InstallationCmd({ itemName, manualCode, ...props }: InstallationCmdProps) {
  const choices = ['npm', 'pnpm', 'bun', manualCode && 'manual'].filter(Boolean) as string[];

  const itemRef = shuipItemRef(itemName);

  return (
    <>
      <Tabs items={choices} className={'w-full **:data-code:px-4'} {...props}>
        <Tab>
          <CodeBlock keepBackground data-code>
            <Pre>npx shadcn@latest add {itemRef}</Pre>
          </CodeBlock>
        </Tab>
        <Tab>
          <CodeBlock keepBackground data-code>
            <Pre>pnpm dlx shadcn@latest add {itemRef}</Pre>
          </CodeBlock>
        </Tab>
        <Tab>
          <CodeBlock keepBackground data-code>
            <Pre>bun x shadcn@latest add {itemRef}</Pre>
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
      <div className='space-y-2 text-sm text-fd-muted-foreground'>
        <p>
          Requires the <code>{SHUIP_NAMESPACE}</code> namespace in <code>components.json</code>. See the{' '}
          <Link href='/docs/installation' className='underline underline-offset-4'>
            installation guide
          </Link>
          .
        </p>
        <div className='**:data-code:px-4'>
          <CodeBlock keepBackground data-code>
            <Pre>{`"registries": { "${SHUIP_NAMESPACE}": "${SHUIP_REGISTRY_URL}" }`}</Pre>
          </CodeBlock>
        </div>
        <p>
          The command is the same for Base UI and Radix: the CLI reads the style in your <code>components.json</code>{' '}
          and installs the matching variant.
        </p>
      </div>
    </>
  );
}
