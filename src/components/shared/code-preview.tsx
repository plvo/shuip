'use client';

import React from 'react';
import { registryIndex } from '#/registry/__index__';
import { Highlight, themes } from 'prism-react-renderer';

interface CodePreviewProps {
  filename: string;
  language?: string;
}

export default function CodePreview({ filename, language = 'typescript' }: CodePreviewProps) {
  const code = React.useMemo(() => {
    const codeSource = registryIndex[filename]?.code;

    if (!codeSource) {
      return null;
    }

    return codeSource;
  }, [filename, language]);

  return (
    <div className="w-full border rounded-lg [&_pre]:my-0 [&_pre]:max-h-[350px] [&_pre]:overflow-auto">
      {code ? (
        <Highlight theme={themes.vsDark} code={code} language="tsx">
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre style={style} className="p-4">
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
      ) : (
        <p className="text-sm text-muted-foreground">
          Component{' '}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">{filename}</code> not
          found in registry.
        </p>
      )}
    </div>
  );
}
