'use client';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import type React from 'react';
import { cn } from '@/lib/utils';
import { CopyButton } from '../ui/shuip/copy-button';
import CodeAllCli from './code.all-cli';
import { CodeHighlight, type CodeHighlightProps } from './code-preview';
import { ItemFooter, type ItemFooterProps } from './item-footer';
import { ItemHeader, type ItemHeaderProps } from './item-header';
import { InstallationCmd, type InstallationCmdProps } from './item-installation';

interface MdxComponentsProps {
  code: string;
  className?: string;
}

export function MdxContent({ code, className }: MdxComponentsProps) {
  const Component = useMDXComponent(code);

  return (
    <div className={cn('mdx', className)}>
      <Component components={components} />
    </div>
  );
}

const components = {
  h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={cn('h1-mdx', className)} {...props} />
  ),
  h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={cn('h2-mdx', className)} {...props} />
  ),
  h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn('h3-mdx', className)} {...props} />
  ),
  h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5 className={cn('h4-mdx', className)} {...props} />
  ),
  a: ({ className, ...props }: React.HTMLAttributes<HTMLAnchorElement>) => (
    <a className={cn('a-mdx', className)} {...props} />
  ),
  p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn('p-mdx', className)} {...props} />
  ),
  ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className={cn('ul-mdx', className)} {...props} />
  ),
  ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className={cn('ol-mdx', className)} {...props} />
  ),
  li: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <li className={cn('li-mdx', className)} {...props} />
  ),
  blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <blockquote className={cn('blockquote-mdx', className)} {...props} />
  ),
  img: ({ className, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // biome-ignore lint/a11y/useAltText: <explanation>
    <img className={cn('img-mdx', className)} alt={alt} {...props} />
  ),
  hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => <hr className='hr-mdx' {...props} />,
  code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code className={cn('code-mdx', className)} {...props} />
  ),
  small: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <small className={cn('small-mdx', className)} {...props} />
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
