import fs from 'node:fs';
import path from 'node:path';
import { toBaseVariant } from './to-base-variant';

const REPO_ROOT = path.resolve(import.meta.dir, '../../..');
const BIOME_BIN = path.join(REPO_ROOT, 'node_modules', '.bin', 'biome');

export type FormatSource = (code: string, filePath: string) => string;

/** Formats with the repository's Biome configuration, the way the sources it derives from are formatted. */
export const formatWithBiome: FormatSource = (code, filePath) => {
  const result = Bun.spawnSync([BIOME_BIN, 'format', `--stdin-file-path=${filePath}`], {
    cwd: REPO_ROOT,
    stdin: Buffer.from(code),
  });
  if (result.exitCode !== 0) {
    throw new Error(`[generate] biome could not format ${filePath}:\n${result.stderr.toString()}`);
  }
  return result.stdout.toString();
};

export interface BaseSource {
  /** What a consumer installs, with the standard `@/components/ui/*` aliases. */
  code: string;
  origin: 'override' | 'codemod' | 'identical';
  warnings: string[];
}

/** An override wins over the codemod; a canonical file the codemod leaves alone is `identical`. */
export const resolveBaseSource = (
  canonicalPath: string,
  overridePath: string | undefined,
  format: FormatSource,
): BaseSource => {
  if (overridePath) {
    return { code: fs.readFileSync(overridePath, 'utf-8'), origin: 'override', warnings: [] };
  }
  const canonical = fs.readFileSync(canonicalPath, 'utf-8');
  const { code, warnings } = toBaseVariant(canonical);
  if (code === canonical) return { code, origin: 'identical', warnings };
  return { code: format(code, canonicalPath), origin: 'codemod', warnings };
};

export interface AliasTargets {
  /** Directory of the stubs that re-export the Base UI copies of the items. */
  stubsDir: string;
  /** Directory of the canonical items, for the shared files that have no Base UI copy. */
  itemsDir: string;
  /** Directory of the Base UI primitives. */
  primitivesDir: string;
  /** The `cn` helper. */
  utilsFile: string;
}

const SHARED_FILES: Record<string, string> = {
  '@/lib/time': 'lib/time/time',
  '@/actions/shuip/places': 'react-hook-form/address-field/extras/places.action',
};

const MODULE_SPECIFIER = /(\bfrom\s+|\bimport\s*\(?\s*)(['"])(@\/[^'"]+)\2/g;

const importPath = (fromFile: string, target: string): string => {
  const relative = path.relative(path.dirname(fromFile), target).split(path.sep).join('/');
  return relative.startsWith('.') ? relative : `./${relative}`;
};

const aliasTarget = (specifier: string, targets: AliasTargets): string | undefined => {
  const shuipUi = specifier.match(/^@\/components\/ui\/shuip\/(.+)$/)?.[1];
  if (shuipUi) return path.join(targets.stubsDir, shuipUi);
  const shuipBlock = specifier.match(/^@\/components\/block\/shuip\/(.+)$/)?.[1];
  if (shuipBlock) return path.join(targets.stubsDir, 'blocks', shuipBlock);
  const primitive = specifier.match(/^@\/components\/ui\/(.+)$/)?.[1];
  if (primitive) return path.join(targets.primitivesDir, primitive);
  if (specifier === '@/lib/utils') return targets.utilsFile;
  const shared = SHARED_FILES[specifier];
  return shared ? path.join(targets.itemsDir, shared) : undefined;
};

/** The copy the docs compile: every alias resolves to a Base UI primitive, a Base UI stub or a shared file. */
export const toDocsSource = (code: string, filePath: string, targets: AliasTargets): string =>
  code.replace(MODULE_SPECIFIER, (match, lead: string, quote: string, specifier: string) => {
    const target = aliasTarget(specifier, targets);
    return target ? `${lead}${quote}${importPath(filePath, target)}${quote}` : match;
  });

export interface OverridePair {
  override: string;
  canonical: string;
}

const git = (cwd: string, args: string[]): string | undefined => {
  try {
    const result = Bun.spawnSync(['git', ...args], { cwd, stdout: 'pipe', stderr: 'ignore' });
    return result.exitCode === 0 ? result.stdout.toString().trim() : undefined;
  } catch {
    return undefined;
  }
};

const isStale = ({ override, canonical }: OverridePair): boolean => {
  const cwd = path.dirname(override);
  const overrideCommit = git(cwd, ['rev-list', '-1', 'HEAD', '--', override]);
  if (!overrideCommit) return false;
  return Number(git(cwd, ['rev-list', '--count', `${overrideCommit}..HEAD`, '--', canonical]) ?? 0) > 0;
};

/**
 * Warnings for overrides whose canonical file has commits newer than the override's last commit.
 * Overrides that are not committed yet, and checkouts without git history, raise nothing.
 */
export const findStaleOverrides = (pairs: OverridePair[], root: string): string[] =>
  pairs
    .filter(isStale)
    .map(
      ({ override, canonical }) =>
        `${path.relative(root, override)} predates the latest commits of ${path.relative(root, canonical)}: check the override still matches the canonical file`,
    );
