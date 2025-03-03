'use client';
import React from 'react';
import { useMDXComponent } from 'next-contentlayer2/hooks';
import { cn } from '@/lib/utils';
import { COMPONENT_CATEGORIES, registryIndex } from '#/registry/__index__';
import InstallationCmd from './installation-cmd';
import ComponentSections from './component.section';

interface MdxComponentsProps {
  category: string;
  code: string;
  className?: string;
}

const components = {
  h1: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={cn('font-heading mt-2 scroll-m-20 text-4xl font-bold', className)} {...props} />
  ),
  h2: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className={cn(
        'font-heading mt-12 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0',
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn('font-heading mt-8 scroll-m-20 text-xl font-semibold tracking-tight', className)} {...props} />
  ),
  h4: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h4 className={cn('font-heading mt-8 scroll-m-20 text-lg font-semibold tracking-tight', className)} {...props} />
  ),
  h5: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h5 className={cn('mt-8 scroll-m-20 text-lg font-semibold tracking-tight', className)} {...props} />
  ),
  h6: ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h6 className={cn('mt-8 scroll-m-20 text-base font-semibold tracking-tight', className)} {...props} />
  ),
  a: ({ className, ...props }: React.HTMLAttributes<HTMLAnchorElement>) => (
    <a className={cn('font-medium underline underline-offset-4', className)} {...props} />
  ),
  p: ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn('leading-7 [&:not(:first-child)]:mt-6', className)} {...props} />
  ),
  ul: ({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className={cn('my-6 ml-6 list-disc', className)} {...props} />
  ),
  ol: ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol className={cn('my-6 ml-6 list-decimal', className)} {...props} />
  ),
  li: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <li className={cn('mt-2', className)} {...props} />
  ),
  blockquote: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <blockquote className={cn('mt-6 border-l-2 pl-6 italic', className)} {...props} />
  ),
  img: ({ className, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={cn('rounded-md', className)} alt={alt} {...props} />
  ),
  hr: ({ ...props }: React.HTMLAttributes<HTMLHRElement>) => <hr className="my-4 md:my-8" {...props} />,
  table: ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className={cn('relative w-full overflow-hidden border-none text-sm', className)} {...props} />
    </div>
  ),
  tr: ({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className={cn('last:border-b-none m-0 border-b', className)} {...props} />
  ),
  th: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <th
      className={cn(
        'px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right',
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
    <td
      className={cn('px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right', className)}
      {...props}
    />
  ),
  code: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <code
      className={cn('relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold', className)}
      {...props}
    />
  ),
  // pre: ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
  //   <pre
  //     className={cn(
  //       'mb-4 mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-slate-100 py-4 dark:border-slate-700 dark:bg-slate-900',
  //       className,
  //     )}
  //     {...props}
  //   />
  // ),
  small: ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <small className={cn('text-sm font-medium leading-none')} {...props} />
  ),
};

export function MdxContent({ category, code, className }: MdxComponentsProps) {
  const Component = useMDXComponent(code);

  const componentsCategory = COMPONENT_CATEGORIES[category] || null;

  const Preview = React.useMemo(() => {
    const Comp = registryIndex['button.submit.example']?.component;

    if (!Comp) {
      return (
        <p className="text-sm text-muted-foreground">
          Component <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">caca</code>{' '}
          not found in registry.
        </p>
      );
    }

    return <Comp />;
  }, []);

  return (
    <div className={cn('mdx', className)}>
      {/* {Preview} */}
      <pre>{JSON.stringify(componentsCategory, null, 2)}</pre>
      <pre>{JSON.stringify(Object.assign(componentsCategory), null, 2)}</pre>
      {componentsCategory &&
        Object.keys(componentsCategory).map((value) => {
          return (
            <pre>
              {/* {JSON.stringify({ value }, null, 2)} */}
              {JSON.stringify(componentsCategory[value], null, 2)}
            </pre>
          );
        })}
      {/* <ComponentSections /> */}
      {/* <Component components={components} /> */}
    </div>
  );
}
