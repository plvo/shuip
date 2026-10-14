import fs from 'node:fs/promises';
import path from 'node:path';
import { RADIX_PACKAGE } from '../radix-package';
import { StepFailure } from './step';

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

export const findRadixPackages = (manifest: Record<string, unknown>): string[] =>
  DEPENDENCY_FIELDS.flatMap((field) =>
    Object.keys((manifest[field] as Record<string, string> | undefined) ?? {}),
  ).filter((name) => RADIX_PACKAGE.test(name));

/** Fails when the project declares a Radix package, which a Base UI project never needs. */
export const assertNoRadixPackages = async (projectDir: string): Promise<void> => {
  const manifest = JSON.parse(await fs.readFile(path.join(projectDir, 'package.json'), 'utf-8'));
  const radixPackages = findRadixPackages(manifest);
  if (radixPackages.length > 0) {
    throw new StepFailure(
      'verify dependencies',
      `A Base UI project depends on Radix packages:\n${radixPackages.join('\n')}`,
    );
  }
};
