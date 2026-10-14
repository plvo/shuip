import { type Base, baseLabel } from '@/lib/base-routes';

/** Tells the reader, at the top of the sidebar, which primitive library the pages and links belong to. */
export function BaseBadge({ base }: { base: Base }) {
  return (
    <div className='flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-3 py-2 text-sm'>
      <span aria-hidden className='size-2 rounded-full bg-fd-primary' />
      <span className='font-medium text-fd-foreground'>{baseLabel(base)}</span>
    </div>
  );
}
