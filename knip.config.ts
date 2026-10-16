import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  // knip never reports the exports of a package entry, and the `exports` maps of packages/ui and packages/registry
  // make most of their files entries. includeEntryExports on those two workspaces checks the exports of their
  // internal files (packages/ui/src/lib, packages/registry/src, ...). These stay exempt because their exports are
  // a published API that knip cannot see being used:
  ignoreIssues: {
    // Vendored shadcn primitives, synced from ui.shadcn.com and never hand-edited; consumers install them whole.
    'packages/ui/src/components/ui/**': ['exports', 'types'],
    'packages/ui/src/components/ui-base/**': ['exports', 'types'],
    // Registry items: the exports of component.*.tsx are the API a consumer imports after `shadcn add`, and each
    // example's default export is loaded lazily through the generated __index__.ts.
    'packages/registry/items/**': ['exports', 'types'],
  },
  workspaces: {
    '.': {
      // normalize-pr-title.cjs is loaded with require() inside the `script:` of actions/github-script,
      // and knip's GitHub Actions plugin reads `run:` commands only. doctor.config.ts is loaded by react-doctor.
      entry: ['.github/scripts/*.cjs', 'doctor.config.ts'],
    },
    'apps/docs': {
      // source.config.ts is loaded by createMDX() in next.config.ts and by the fumadocs-mdx postinstall,
      // and knip has no fumadocs plugin. changelog-content.tsx is imported from content/docs/changelog.mdx,
      // and knip compiles MDX only with an @mdx-js/* package or compilers.mdx, which pulls in every item index.mdx.
      // Remove the changelog-content.tsx entry if changelog.mdx stops importing it: knip then flags the file and
      // next-mdx-remote, which is the signal wanted.
      entry: ['source.config.ts', 'src/components/changelog-content.tsx'],
    },
    'packages/ui': {
      includeEntryExports: true,
    },
    'packages/config': {
      // The tsconfig `plugins: [{ "name": "next" }]` entry of ts/nextjs.json. This package ships presets only,
      // and the consuming app provides next.
      ignoreUnresolved: ['next'],
    },
    'packages/registry': {
      includeEntryExports: true,
      // packages/ui is consumed by path, not by import: scripts/generate.ts resolves '../ui/src' and both
      // registry tsconfigs alias @/components/ui/*. The workspace dependency documents that relationship.
      // Remove this entry if the dependency is dropped from packages/registry/package.json, or if the registry
      // starts importing @repo/ui by name.
      ignoreDependencies: ['@repo/ui'],
    },
  },
};

export default config;
