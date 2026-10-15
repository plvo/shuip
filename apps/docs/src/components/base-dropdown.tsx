'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DropdownMenu } from 'radix-ui';
import { type Base, type BaseChoice, type BasedPages, baseChoices } from '@/lib/base-routes';
import { cn } from '@/lib/utils';

export interface BaseDropdownMenuProps {
  choices: BaseChoice[];
}

/** The menu that picks the primitive library; each option is a link to the page it switches to. */
export function BaseDropdownMenu({ choices }: BaseDropdownMenuProps) {
  const active = choices.find((choice) => choice.active);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={`Primitive library: ${active?.label}`}
        className='flex w-full items-center gap-2 rounded-lg border bg-fd-secondary/50 p-2 text-start text-fd-secondary-foreground transition-colors hover:bg-fd-accent data-[state=open]:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring'
      >
        <span className='grid'>
          <span className='text-sm font-medium'>{active?.label}</span>
          <span className='text-[0.8125rem] text-fd-muted-foreground'>{active?.description}</span>
        </span>
        <ChevronsUpDown aria-hidden className='ms-auto size-4 shrink-0 text-fd-muted-foreground' />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align='start'
          sideOffset={4}
          className='z-50 w-(--radix-dropdown-menu-trigger-width) origin-(--radix-dropdown-menu-content-transform-origin) rounded-xl border bg-fd-popover p-1 text-sm text-fd-popover-foreground shadow-lg data-[state=closed]:animate-fd-popover-out data-[state=open]:animate-fd-popover-in'
        >
          <DropdownMenu.RadioGroup value={active?.base}>
            {choices.map((choice) => (
              <DropdownMenu.RadioItem key={choice.base} value={choice.base} asChild>
                <Link
                  href={choice.href}
                  className='flex items-center gap-2 rounded-lg p-2 outline-none transition-colors data-[highlighted]:bg-fd-accent data-[highlighted]:text-fd-accent-foreground'
                >
                  <span className='grid'>
                    <span className='text-sm font-medium'>{choice.label}</span>
                    <span className='text-[0.8125rem] text-fd-muted-foreground'>{choice.description}</span>
                  </span>
                  <Check
                    aria-hidden
                    className={cn('ms-auto size-3.5 shrink-0 text-fd-primary', !choice.active && 'invisible')}
                  />
                </Link>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export interface BaseDropdownProps {
  base: Base;
  /** The pages that exist in each base, which tell where a switch lands. */
  pages: BasedPages;
}

/** Switches the primitive library from the sidebar, to the same page in the other base when it exists. */
export function BaseDropdown({ base, pages }: BaseDropdownProps) {
  return <BaseDropdownMenu choices={baseChoices(usePathname(), base, pages)} />;
}
