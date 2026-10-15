/**
 * The tabs of one group share their selected tab, across pages and visits. fumadocs keeps it in the browser storage
 * under the group id, and restores it after hydration, so pages stay static.
 */
export const TAB_GROUPS = {
  packageManager: 'shuip-tabs-package-manager',
  previewMode: 'shuip-tabs-preview-mode',
} as const;
