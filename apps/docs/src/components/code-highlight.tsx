import { highlight } from 'fumadocs-core/highlight';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import type * as React from 'react';
import { codeHighlightOptions } from '@/lib/code-themes';

export interface CodeHighlightProps {
  code: string;
}

/** The TSX source of an item or an example, highlighted with the themes of the MDX code blocks. */
export function CodeHighlight({ code }: CodeHighlightProps): Promise<React.ReactNode> {
  return highlight(code, {
    lang: 'tsx',
    ...codeHighlightOptions,
    components: {
      pre: ({ ref: _ref, ...props }) => (
        <CodeBlock {...props}>
          <Pre>{props.children}</Pre>
        </CodeBlock>
      ),
    },
  });
}
