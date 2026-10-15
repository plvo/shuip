import { type Base, baseLabel } from '@/lib/base-routes';

/** Tells the reader, at the top of the sidebar, which primitive library the pages and links belong to. */
export function BaseBadge({ base }: { base: Base }) {
  return (
    <p className='px-3 py-1 text-sm text-fd-muted-foreground'>
      Primitives: <span className='font-medium text-fd-foreground'>{baseLabel(base)}</span>
    </p>
  );
}
