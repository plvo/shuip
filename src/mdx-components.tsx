import Link from 'next/link';
import type React from 'react';
import { CopyButton } from '#/registry/ui/copy-button';
import CodeAllCli from './components/mdx/code.all-cli';
import { CodeHighlight, type CodeHighlightProps } from './components/mdx/code-preview';
import { ItemFooter, type ItemFooterProps } from './components/mdx/item-footer';
import { ItemHeader, type ItemHeaderProps } from './components/mdx/item-header';
import { InstallationCmd, type InstallationCmdProps } from './components/mdx/item-installation';
import { cn } from './lib/utils';

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
  h1: ({ ...props }: HeadingProps) => <h1 className={'h1-mdx'} {...props} />,
  h2: ({ ...props }: HeadingProps) => <h2 className={'h2-mdx'} {...props} />,
  h3: ({ ...props }: HeadingProps) => <h3 className={'h3-mdx'} {...props} />,
  h4: ({ ...props }: HeadingProps) => <h4 className={'h4-mdx'} {...props} />,
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
  CodeAllCli: ({ ...props }: React.HTMLAttributes<HTMLElement>) => <CodeAllCli {...props} />,
  InstallationCmd: ({ filename, ...props }: InstallationCmdProps) => <InstallationCmd filename={filename} {...props} />,
  CodeHighlight: ({ code, language = 'tsx', ...props }: CodeHighlightProps & React.HTMLAttributes<HTMLDivElement>) => (
    <div className='flex justify-between rounded-lg border my-6 overflow-x-auto bg-[#1E1E1E]' {...props}>
      <CodeHighlight code={code} language={language} />
      <CopyButton value={code} className='pt-6 pr-6' />
    </div>
  ),
  ItemHeader: ({ filename, text }: ItemHeaderProps) => <ItemHeader filename={filename} text={text} />,
  ItemFooter: ({ itemName, props }: ItemFooterProps) => <ItemFooter itemName={itemName} props={props} />,
};

declare global {
  type MDXProvidedComponents = typeof mdxComponents;
}

export function useMDXComponents(): MDXProvidedComponents {
  return mdxComponents;
}
