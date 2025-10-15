'use client';

import { Highlight, themes } from 'prism-react-renderer';

export interface CodePreviewProps {
  code?: string;
  language?: string;
}

export function CodePreview({ code, language }: CodePreviewProps) {
  return (
    <div className='w-full max-w-[880px] rounded-md [&_pre]:my-0 [&_pre]:max-h-[350px] [&_pre]:overflow-auto'>
      {code ? (
        <CodeHighlight code={code} language={language} />
      ) : (
        <p className='text-sm text-muted-foreground'>Code not found.</p>
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
        <pre style={style} className='p-4 text-sm'>
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
