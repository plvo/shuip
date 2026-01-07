import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import type React from 'react';
import { CopyButton } from '#/registry/ui/copy-button';
import { CodeHighlight, type CodeHighlightProps } from './components/mdx/code-preview';
import { ComparisonTable, type ComparisonTableProps } from './components/mdx/comparison-table';
import {
  ItemExamples,
  type ItemExamplesProps,
  ItemHeader,
  type ItemHeaderProps,
  type Prop,
  PropTable,
} from './components/mdx/item-content';
import { InstallationCmd, type InstallationCmdProps } from './components/mdx/item-installation';
import { titleToFilename } from './lib/utils';

type HeadingProps = React.ComponentPropsWithoutRef<'h1'>;

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ...components,
    h1: ({ ...props }: HeadingProps) => (
      <h1 id={titleToFilename(props.children?.toString() ?? '')} className={'h1-mdx'} {...props} />
    ),
    h2: ({ ...props }: HeadingProps) => (
      <h2 id={titleToFilename(props.children?.toString() ?? '')} className={'h2-mdx'} {...props} />
    ),
    CodeHighlight: ({
      code,
      language = 'tsx',
      ...props
    }: CodeHighlightProps & React.HTMLAttributes<HTMLDivElement>) => (
      <div className='flex justify-between rounded-lg border my-6 overflow-x-auto bg-[#1E1E1E]' {...props}>
        <CodeHighlight code={code} language={language} />
        <CopyButton value={code} className='pt-6 pr-6' />
      </div>
    ),
    InstallationCmd: ({ registryPath, ...props }: InstallationCmdProps) => (
      <InstallationCmd registryPath={registryPath} {...props} />
    ),
    ItemHeader: ({ registryName, text }: ItemHeaderProps) => <ItemHeader registryName={registryName} text={text} />,
    ItemExamples: ({ registryName }: ItemExamplesProps) => <ItemExamples registryName={registryName} />,
    PropTable: ({ props, title }: { props: Prop[]; title?: string }) => <PropTable props={props} title={title} />,
    ComparisonTable: ({ rows, headers }: ComparisonTableProps) => <ComparisonTable rows={rows} headers={headers} />,
  };
}

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}

export function useMDXComponents(): MDXProvidedComponents {
  return getMDXComponents();
}
