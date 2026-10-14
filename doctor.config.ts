export default {
  ignore: {
    // Primitives synced unmodified from the official shadcn registry (see packages/ui/scripts/sync-primitives.ts).
    files: ['**/src/components/ui/**', '**/src/components/ui-base/**'],
    overrides: [
      {
        // Registry items ship as a single component.radix.tsx per the one-file-per-block
        // contract, so their internal sub-components are intentionally not exported.
        files: ['packages/registry/items/**'],
        rules: ['react-doctor/only-export-components'],
      },
    ],
  },
};
