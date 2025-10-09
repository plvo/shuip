import Link from 'next/link';
import type React from 'react';
import { CopyButton } from '#/registry/ui/copy-button';
import { CodeHighlight, type CodeHighlightProps } from './components/mdx/code-preview';
import {
  ItemExamples,
  type ItemExamplesProps,
  ItemHeader,
  type ItemHeaderProps,
  type Prop,
  PropTable,
} from './components/mdx/item-content';
import { InstallationCmd, type InstallationCmdProps } from './components/mdx/item-installation';
import { cn, titleToFilename } from './lib/utils';

type HeadingProps = React.ComponentPropsWithoutRef<'h1'>;
type ParagraphProps = React.ComponentPropsWithoutRef<'p'>;
type ListProps = React.ComponentPropsWithoutRef<'ul'>;
type ListItemProps = React.ComponentPropsWithoutRef<'li'>;
type AnchorProps = React.ComponentPropsWithoutRef<'a'>;
type BlockquoteProps = React.ComponentPropsWithoutRef<'blockquote'>;
type HRProps = React.ComponentPropsWithoutRef<'hr'>;
type SmallProps = React.ComponentPropsWithoutRef<'small'>;
type CodeProps = React.ComponentPropsWithoutRef<'code'>;

export const mdxComponents = {
  h1: ({ ...props }: HeadingProps) => (
    <h1 id={titleToFilename(props.children?.toString() ?? '')} className={'h1-mdx'} {...props} />
  ),
  h2: ({ ...props }: HeadingProps) => (
    <h2 id={titleToFilename(props.children?.toString() ?? '')} className={'h2-mdx'} {...props} />
  ),
  h3: ({ ...props }: HeadingProps) => (
    <h3 id={titleToFilename(props.children?.toString() ?? '')} className={'h3-mdx'} {...props} />
  ),
  h4: ({ ...props }: HeadingProps) => (
    <h4 id={titleToFilename(props.children?.toString() ?? '')} className={'h4-mdx'} {...props} />
  ),
  p: ({ ...props }: ParagraphProps) => <p className={'p-mdx'} {...props} />,
  em: (props: React.ComponentPropsWithoutRef<'em'>) => <em className='em-mdx' {...props} />,
  strong: (props: React.ComponentPropsWithoutRef<'strong'>) => <strong className='strong-mdx' {...props} />,
  hr: ({ ...props }: HRProps) => <hr className='hr-mdx' {...props} />,
  small: ({ ...props }: SmallProps) => <small className={'small-mdx'} {...props} />,
  ul: ({ ...props }: ListProps) => <ul className={'ul-mdx'} {...props} />,
  ol: ({ ...props }: ListProps) => <ol className={'ol-mdx'} {...props} />,
  li: ({ ...props }: ListItemProps) => <li className={'li-mdx'} {...props} />,
  code: ({ ...props }: CodeProps) => <code className='code-mdx' {...props} />,
  blockquote: ({ ...props }: BlockquoteProps) => <blockquote className={'blockquote-mdx'} {...props} />,
  a: ({ href, children, className, ...props }: AnchorProps) => {
    if (href?.startsWith('/')) {
      return (
        <Link href={href} className={'a-mdx'} {...props}>
          {children}
        </Link>
      );
    }
    if (href?.startsWith('#')) {
      return (
        <a href={href} className={'a-mdx'} {...props}>
          {children}
        </a>
      );
    }
    return (
      <a href={href} target='_blank' rel='noopener noreferrer' className={'a-mdx'} {...props}>
        {children}
      </a>
    );
  },
  img: ({ className, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // biome-ignore lint/performance/noImgElement: false positive
    <img className={cn('img-mdx', className)} alt={alt} {...props} />
  ),
  CodeHighlight: ({ code, language = 'tsx', ...props }: CodeHighlightProps & React.HTMLAttributes<HTMLDivElement>) => (
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
  PropTable: ({ props }: { props: Prop[] }) => <PropTable props={props} />,
};

declare global {
  type MDXProvidedComponents = typeof mdxComponents;
}

export function useMDXComponents(): MDXProvidedComponents {
  return mdxComponents;
}
