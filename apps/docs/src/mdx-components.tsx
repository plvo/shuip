import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import type React from 'react';
import { BaseOnly, type BaseOnlyProps } from './components/base-only';
import { BlocksList } from './components/blocks-list';
import { ComponentsGallery } from './components/components-gallery';
import { ItemExamples, type ItemExamplesProps, ItemHeader, type ItemHeaderProps } from './components/item-content';
import { type Base, DEFAULT_BASE } from './lib/base-routes';

/** The item blocks of an MDX page read the base of the route the page is rendered for. */
export function getMDXComponents(components?: MDXComponents, base: Base = DEFAULT_BASE) {
  return {
    ...defaultMdxComponents,
    ...components,
    ItemHeader: (props: Omit<ItemHeaderProps, 'base'>) => <ItemHeader base={base} {...props} />,
    ItemExamples: (props: Omit<ItemExamplesProps, 'base'>) => <ItemExamples base={base} {...props} />,
    BaseOnly: (props: Omit<BaseOnlyProps, 'activeBase'>) => <BaseOnly activeBase={base} {...props} />,
    ComponentsGallery: () => <ComponentsGallery base={base} />,
    BlocksList: () => <BlocksList base={base} />,
    pre: ({ ref: _ref, ...props }: React.ComponentPropsWithoutRef<'pre'> & { ref?: React.Ref<HTMLPreElement> }) => (
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
