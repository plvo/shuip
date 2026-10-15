'use client';

import { SHUIP_NAMESPACE, SHUIP_REGISTRY_URL, shuipItemRef } from '@repo/registry/namespace';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
} from 'fumadocs-ui/components/ui/accordion';
import Link from 'next/link';
import type React from 'react';
import { CodeHighlight } from './item-preview';

const registriesSnippet = JSON.stringify({ registries: { [SHUIP_NAMESPACE]: SHUIP_REGISTRY_URL } }, null, 2);

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
      <p className='text-sm text-fd-muted-foreground'>
        The command is the same for Base UI and Radix: the CLI reads the style in your <code>components.json</code> and
        installs the matching variant.
      </p>
      <Accordion type='single' collapsible className='overflow-visible rounded-none border-0 bg-transparent'>
        <AccordionItem value='namespace'>
          <AccordionHeader asChild className='font-normal text-fd-muted-foreground text-sm'>
            <div>
              <AccordionTrigger className='px-0 py-1.5'>
                Command fails? Add the {SHUIP_NAMESPACE} namespace first
              </AccordionTrigger>
            </div>
          </AccordionHeader>
          <AccordionContent>
            <div className='space-y-2 pb-1 text-sm'>
              <p>
                Add the namespace to your <code>components.json</code> once per project. See the{' '}
                <Link href='/docs/installation#picking-the-base' className='a-mdx'>
                  installation guide
                </Link>{' '}
                for how the style picks the base.
              </p>
              <div className='**:data-code:px-4'>
                <CodeBlock keepBackground data-code>
                  <Pre className='w-full whitespace-pre-wrap break-words'>{registriesSnippet}</Pre>
                </CodeBlock>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </>
  );
}
