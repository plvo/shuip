'use client';

import { ReloadIcon } from '@radix-ui/react-icons';
import { REGISTRY_INDEX } from '@repo/registry/__index__';
import { CodeBlock } from 'fumadocs-ui/components/codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Highlight, themes } from 'prism-react-renderer';
import * as React from 'react';

export interface ItemPreviewProps {
  registryName: string;
}

export function ItemPreview({ registryName }: ItemPreviewProps) {
  const code = REGISTRY_INDEX[registryName]?.code;

  return (
    <Tabs items={['preview', 'code']}>
      <Tab className='p-0'>
        <Preview registryName={registryName} />
      </Tab>
      <Tab>
        <CodeBlock className='px-4'>
          <CodeHighlight code={code} language='tsx' />
        </CodeBlock>
      </Tab>
    </Tabs>
  );
}

export function Preview({ registryName }: { registryName: string }) {
  const PreviewComponent = React.useMemo(() => {
    const Comp = REGISTRY_INDEX[registryName]?.component;

    if (!Comp) {
      return () => (
        <p className='text-sm text-muted-foreground'>
          Component{' '}
          <code className='relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm'>{registryName}</code>{' '}
          not found in registry.
        </p>
      );
    }

    return Comp;
  }, [registryName]);

  return (
    <div className='w-full min-h-[150px] flex items-center justify-center p-8 bg-card border border-border rounded-md'>
      <React.Suspense
        fallback={
          <div className='flex w-full items-center justify-center text-sm text-muted-foreground'>
            <ReloadIcon className='mr-2 size-4 animate-spin' />
            Loading...
          </div>
        }
      >
        <PreviewComponent />
      </React.Suspense>
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
