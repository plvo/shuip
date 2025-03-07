'use client';

import React from 'react';
import { registryIndex } from '#/registry/__index__';
import { Highlight, themes } from 'prism-react-renderer';
import ButtonCopy from './button.copy';

interface CodePreviewProps {
  code?: string;
  filename?: string;
  language?: string;
}

export default function CodePreview({ code, filename }: CodePreviewProps) {
  const codeString = code
    ? code
    : React.useMemo(() => {
        const codeSource = registryIndex[filename!]?.code;

        if (!codeSource) {
          return null;
        }

        return codeSource;
      }, [filename]);

  return (
    <div className="w-full border rounded-lg [&_pre]:my-0 [&_pre]:max-h-[350px] [&_pre]:overflow-auto">
      {codeString ? (
        <CodeHighlight code={codeString} />
      ) : (
        <p className="text-sm text-muted-foreground">Component not found in registry.</p>
      )}
    </div>
  );
}

interface CodeHighlightProps {
  code: string;
  language?: string;
}

export function CodeHighlight({ code, language = 'tsx' }: CodeHighlightProps) {
  return (
    <div>
      <div className="flex items-center justify-between p-2 border-b">
        {/* TODO V0 */}
        <ButtonCopy value={code} />
      </div>
      <Highlight theme={themes.vsDark} code={code} language={language}>
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
    </div>
  );
}
