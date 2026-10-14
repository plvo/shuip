'use client';

import { CodeBlock } from 'fumadocs-ui/components/codeblock';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import { Highlight, themes } from 'prism-react-renderer';
import type * as React from 'react';

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
