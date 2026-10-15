/**
 * The tabs of one group share their selected tab, across pages and visits. fumadocs keeps it in the browser storage
 * under the group id, and restores it after hydration, so pages stay static.
 */
export const TAB_GROUPS = {
  packageManager: 'shuip-tabs-package-manager',
} as const;

/** The group of the Preview / Code tabs of an example; its key does not name a base, so a base switch keeps the tab. */
export const previewGroupId = (exampleKey: string): string => `shuip-tabs-preview-mode:${exampleKey}`;
