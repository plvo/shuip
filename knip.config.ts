import type { KnipConfig } from 'knip';

const config: KnipConfig = {
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
      entry: ['source.config.ts', 'src/components/changelog-content.tsx'],
    },
    'packages/config': {
      // The tsconfig `plugins: [{ "name": "next" }]` entry of ts/nextjs.json. This package ships presets only,
      // and the consuming app provides next.
      ignoreUnresolved: ['next'],
    },
    'packages/registry': {
      // packages/ui is consumed by path, not by import: scripts/generate.ts resolves '../ui/src' and both
      // registry tsconfigs alias @/components/ui/*. The workspace dependency documents that relationship.
      ignoreDependencies: ['@repo/ui'],
    },
  },
};

export default config;
