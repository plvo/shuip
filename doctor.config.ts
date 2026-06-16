import { defineConfig } from 'react-doctor';

export default defineConfig({
  ignore: {
    overrides: [
      {
        // Registry items ship as a single component.tsx per the one-file-per-block
        // contract, so their internal sub-components are intentionally not exported.
        files: ['packages/registry/items/**'],
        rules: ['react-doctor/only-export-components'],
      },
    ],
  },
});
