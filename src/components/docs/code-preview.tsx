'use client';

import { registryIndex } from '#/registry/__index__';
import React from 'react';

interface CodePreviewProps {
  filename: string;
}

export default function CodePreview({ filename }: CodePreviewProps) {
  const code = React.useMemo(() => {
    const codeSource = registryIndex[filename]?.code;

    if (!codeSource) {
      return (
        <p className="text-sm text-muted-foreground">
          Component{' '}
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">{filename}</code> not
          found in registry.
        </p>
      );
    }

    return codeSource;
  }, [filename]);

  return (
    <div className="w-full border p-2 rounded-lg [&_pre]:my-0 [&_pre]:max-h-[350px] [&_pre]:overflow-auto">
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
