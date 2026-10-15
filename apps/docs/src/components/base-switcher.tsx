import Link from 'next/link';
import { BASES, type Base, baseLabel, siblingUrl } from '@/lib/base-routes';
import { cn } from '@/lib/utils';

export interface BaseSwitcherProps {
  base: Base;
  /** Address of the current page, whose sibling in each base the tabs link to. */
  url: string;
}

export function BaseSwitcher({ base, url }: BaseSwitcherProps) {
  return (
    <nav aria-label='Primitive library' className='flex gap-1 border-b border-fd-border'>
      {BASES.map((candidate) => (
        <Link
          key={candidate}
          href={siblingUrl(url, candidate) ?? url}
          aria-current={candidate === base ? 'page' : undefined}
          className={cn(
            '-mb-px inline-flex min-h-11 items-center rounded-t-md border-b-2 px-3 text-sm font-medium no-underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
            candidate === base
              ? 'border-fd-primary text-fd-foreground'
              : 'border-transparent text-fd-muted-foreground hover:text-fd-foreground',
          )}
        >
          {baseLabel(candidate)}
        </Link>
      ))}
    </nav>
  );
}
