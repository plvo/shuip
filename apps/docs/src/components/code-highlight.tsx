import { highlightHast } from 'fumadocs-core/highlight';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import type * as React from 'react';
import { codeHighlightOptions } from '@/lib/code-themes';
import { HighlightedLines, type HighlightedLinesProps } from './highlighted-lines';

export interface CodeHighlightProps {
  code: string;
}

type HighlightedRoot = Awaited<ReturnType<typeof highlightHast>>;
type HighlightedNode = HighlightedRoot['children'][number];
type HighlightedElement = Extract<HighlightedNode, { type: 'element' }>;
type HighlightedContent = HighlightedElement['children'][number];

const isElement = (node: HighlightedNode | HighlightedContent): node is HighlightedElement => node.type === 'element';

const textOf = (node: HighlightedContent): string =>
  node.type === 'text' ? node.value : isElement(node) ? node.children.map(textOf).join('') : '';

const cssDeclarationsOf = (css: string): Record<string, string> =>
  Object.fromEntries(
    css
      .split(';')
      .filter(Boolean)
      .map((declaration) => {
        const separator = declaration.indexOf(':');
        return [declaration.slice(0, separator), declaration.slice(separator + 1)];
      }),
  );

const compactLinesOf = (lineElements: HighlightedElement[]): Pick<HighlightedLinesProps, 'styles' | 'lines'> => {
  const styles: Record<string, string>[] = [];
  const styleIndexes = new Map<string, number>();
  const styleIndexOf = (css: string): number => {
    const known = styleIndexes.get(css);
    if (known !== undefined) return known;
    styles.push(cssDeclarationsOf(css));
    styleIndexes.set(css, styles.length - 1);
    return styles.length - 1;
  };

  const lines = lineElements.map((line) =>
    line.children
      .filter(isElement)
      .flatMap((token) => [styleIndexOf(String(token.properties.style ?? '')), textOf(token).length]),
  );
  return { styles, lines };
};

/**
 * The TSX source of an item or an example, highlighted with the themes of the MDX code blocks.
 * The client receives the source and the runs of its tokens, a payload close to the plain source,
 * where one element per token would weigh about ten times as much.
 */
export async function CodeHighlight({ code }: CodeHighlightProps): Promise<React.ReactNode> {
  const root = await highlightHast(code, { lang: 'tsx', ...codeHighlightOptions });
  const pre = root.children.filter(isElement).find(({ tagName }) => tagName === 'pre');
  const codeElement = pre?.children.filter(isElement).find(({ tagName }) => tagName === 'code');
  if (!pre || !codeElement) throw new Error('Shiki returned no code block');

  const { class: className, style } = pre.properties;

  return (
    <CodeBlock className={String(className)} style={cssDeclarationsOf(String(style))}>
      <Pre>
        <HighlightedLines code={code} {...compactLinesOf(codeElement.children.filter(isElement))} />
      </Pre>
    </CodeBlock>
  );
}
