import { assertEveryItemServedLocally } from './install-source';
import { assertNoRadixPackages } from './project-dependencies';
import type { ScaffoldStyle } from './scaffold';

interface InstalledProject {
  scaffold: ScaffoldStyle;
  projectDir: string;
  /** The items asked for. */
  names: string[];
  /** Request paths the local registry server answered with a file. */
  servedPaths: ReadonlySet<string>;
}

/** Checks what the install left behind: every item came from the local registry, and a Base UI project has no Radix package. */
export const verifyInstall = async ({ scaffold, projectDir, names, servedPaths }: InstalledProject): Promise<void> => {
  assertEveryItemServedLocally(servedPaths, scaffold.style, names);
  if (scaffold.base === 'base') {
    await assertNoRadixPackages(projectDir);
  }
};
