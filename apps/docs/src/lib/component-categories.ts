export interface ComponentCategory {
  /** First slug of the pages of the category; `components` holds the pages directly under the section. */
  id: string;
  label: string;
  /** Whether the category has a guide page at its own address. */
  hasGuide: boolean;
}

/** The categories of the components section, in the order the sidebar and the gallery list them. */
export const COMPONENT_CATEGORIES: readonly ComponentCategory[] = [
  { id: 'components', label: 'Components', hasGuide: false },
  { id: 'react-hook-form', label: 'React Hook Form', hasGuide: true },
  { id: 'tanstack-form', label: 'TanStack Form', hasGuide: true },
  { id: 'tanstack-query', label: 'TanStack Query', hasGuide: true },
];

/** The category a page belongs to, from its slugs. */
export const categoryOf = (slugs: readonly string[]): string => (slugs.length === 1 ? 'components' : (slugs[0] ?? ''));
