'use client';

import { SidebarTabsDropdown } from 'fumadocs-ui/components/sidebar/tabs/dropdown';
import type { LayoutTab } from 'fumadocs-ui/layouts/shared';
import { usePathname } from 'next/navigation';
import { type Base, type BaseChoice, type BasedPages, baseChoices } from '@/lib/base-routes';

/** The options of the dropdown, one per base; the base of `pathname` is the one the dropdown shows as selected. */
export const baseDropdownOptions = (choices: BaseChoice[], pathname: string): LayoutTab[] =>
  choices.map((choice) => ({
    url: choice.href,
    title: choice.label,
    description: choice.description,
    urls: new Set(choice.active ? [pathname] : []),
  }));

export interface BaseDropdownProps {
  base: Base;
  /** The pages that exist in each base, which tell where a switch lands. */
  pages: BasedPages;
}

/** Switches the primitive library from the sidebar, to the same page in the other base when it exists. */
export function BaseDropdown({ base, pages }: BaseDropdownProps) {
  const pathname = usePathname();
  const choices = baseChoices(pathname, base, pages);

  return (
    <SidebarTabsDropdown
      options={baseDropdownOptions(choices, pathname)}
      aria-label={`Primitive library: ${choices.find((choice) => choice.active)?.label}`}
    />
  );
}
