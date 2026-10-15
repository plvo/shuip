import Link from 'next/link';
import { type Base, type BasedPages, baseChoices } from '@/lib/base-routes';
import { cn } from '@/lib/utils';

export interface BaseSwitcherProps {
  base: Base;
  /** Address of the current page, whose sibling in each base the tabs link to. */
  url: string;
  /** The pages that exist in each base, which tell where a tab lands. */
  pages: BasedPages;
}

export function BaseSwitcher({ base, url, pages }: BaseSwitcherProps) {
  return (
    <nav aria-label='Primitive library' className='flex gap-1 border-b border-fd-border'>
      {baseChoices(url, base, pages).map((choice) => (
        <Link
          key={choice.base}
          href={choice.href}
          aria-current={choice.active ? 'page' : undefined}
          className={cn(
            '-mb-px inline-flex min-h-11 items-center rounded-t-md border-b-2 px-3 text-sm font-medium no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
            choice.active
              ? 'border-fd-primary text-fd-foreground'
              : 'border-transparent text-fd-muted-foreground hover:text-fd-foreground',
          )}
        >
          {choice.label}
        </Link>
      ))}
    </nav>
  );
}
