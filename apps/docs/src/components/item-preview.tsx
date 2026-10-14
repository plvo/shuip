'use client';

import { CodeBlock } from 'fumadocs-ui/components/codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Loader2Icon } from 'lucide-react';
import { Highlight, themes } from 'prism-react-renderer';
import * as React from 'react';

export interface ItemPreviewProps {
  code: string;
  children: React.ReactNode;
}

export function ItemPreview({ code, children }: ItemPreviewProps) {
  return (
    <Tabs items={['preview', 'code']}>
      <Tab className='p-0'>{children}</Tab>
      <Tab>
        <CodeBlock className='px-4'>
          <CodeHighlight code={code} language='tsx' />
        </CodeBlock>
      </Tab>
    </Tabs>
  );
}

export interface PreviewFrameProps {
  registryName: string;
  component: React.ComponentType | undefined;
}

export function PreviewFrame({ registryName, component: PreviewComponent }: PreviewFrameProps) {
  return (
    <div className='not-prose w-full min-h-[150px] flex items-center justify-center p-8 bg-background border border-border rounded-md'>
      {PreviewComponent ? (
        <React.Suspense
          fallback={
            <div className='flex w-full items-center justify-center text-sm text-muted-foreground'>
              <Loader2Icon className='mr-2 size-4 animate-spin' />
              Loading...
            </div>
          }
        >
          <PreviewComponent />
        </React.Suspense>
      ) : (
        <p className='text-sm text-muted-foreground'>
          Component{' '}
          <code className='relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm'>{registryName}</code>{' '}
          not found in registry.
        </p>
      )}
    </div>
  );
}

export interface CodeHighlightProps {
  code: string;
  language?: string;
}

export function CodeHighlight({ code, language = 'tsx' }: CodeHighlightProps) {
  return (
    <Highlight theme={themes.vsDark} code={code} language={language}>
      {({ style: _, tokens, getLineProps, getTokenProps }) => (
        <pre className='text-xs'>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}
