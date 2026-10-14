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
            '-mb-px border-b-2 px-3 py-2 text-sm font-medium no-underline transition-colors',
            candidate === base
              ? 'border-fd-primary text-fd-primary'
              : 'border-transparent text-fd-muted-foreground hover:text-fd-foreground',
          )}
        >
          {baseLabel(candidate)}
        </Link>
      ))}
    </nav>
  );
}
