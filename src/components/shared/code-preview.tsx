'use client';

import { Highlight, themes } from 'prism-react-renderer';
import React from 'react';
import { registryIndex } from '#/registry/__index__';
import ButtonCopy from './button.copy';

export interface CodePreviewProps {
  code?: string;
  filename?: string;
  language?: string;
}

export function CodePreview({ code, filename, language = 'tsx' }: CodePreviewProps) {
  const codeString = code
    ? code
    : React.useMemo(() => {
        const codeSource = registryIndex[filename as keyof typeof registryIndex]?.code;

        if (!codeSource) {
          return null;
        }

        return codeSource;
      }, [filename]);

  return (
    <div className='w-full border rounded-lg [&_pre]:my-0 [&_pre]:max-h-[350px] [&_pre]:overflow-auto'>
      {codeString ? (
        <div>
          <div className='flex items-center justify-between p-2 border-b'>
            {/* TODO V0 */}
            <ButtonCopy value={codeString} />
          </div>
          <CodeHighlight code={codeString} language={language} />
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>Component not found in registry.</p>
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
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre style={style} className='p-4'>
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
