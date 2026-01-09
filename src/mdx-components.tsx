import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import type React from 'react';
import { ItemExamples, ItemHeader } from './components/item-content';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...components,
    ItemHeader,
    ItemExamples,
    pre: ({
      ref: _ref,
      ...props
    }: React.ComponentPropsWithoutRef<'pre'> & { ref?: React.RefObject<HTMLPreElement> }) => (
      <CodeBlock {...props}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
  };
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}

export function useMDXComponents(): MDXProvidedComponents {
  return getMDXComponents();
}
