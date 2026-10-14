import { shuipItemRef } from '../src/namespace';

interface BunWorkspacesPackageJson {
  workspaces?: {
    catalog?: Record<string, string>;
    catalogs?: Record<string, Record<string, string>>;
  };
}

export type Catalog = Record<string, string>;

export const flattenCatalogs = (rootPackageJson: BunWorkspacesPackageJson): Catalog => ({
  ...rootPackageJson.workspaces?.catalog,
  ...Object.assign({}, ...Object.values(rootPackageJson.workspaces?.catalogs ?? {})),
});

// The consuming project owns these; pinning them would rewrite its own framework versions.
const PROVIDED_BY_PROJECT = new Set(['react', 'react-dom', 'next']);

export const pinDependencies = (packages: string[], catalog: Catalog, itemName: string): string[] =>
  packages
    .filter((pkg) => !PROVIDED_BY_PROJECT.has(pkg))
    .map((pkg) => {
      const range = catalog[pkg];
      if (!range) throw new Error(`${itemName} imports "${pkg}", which has no entry in the root Bun catalog`);
      return `${pkg}@${range}`;
    });

export interface RegistryDependencySources {
  primitives: string[];
  shuipItems: string[];
}

export const buildRegistryDependencies = ({ primitives, shuipItems }: RegistryDependencySources): string[] =>
  Array.from(new Set([...primitives, ...shuipItems.map(shuipItemRef)])).sort();
