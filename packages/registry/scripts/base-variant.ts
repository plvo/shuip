import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { toBaseVariant } from './to-base-variant';

const REPO_ROOT = path.resolve(import.meta.dir, '../../..');
const BIOME_BIN = path.join(REPO_ROOT, 'node_modules', '.bin', 'biome');
const BIOME_CONFIG = path.join(REPO_ROOT, 'biome.json');

/**
 * Formats the codes with the repository's Biome configuration, the way the sources they derive from are
 * formatted, and returns them in the order given. One Biome process serves all the codes; they are staged
 * in a temporary folder because the repository configuration excludes the generated folders.
 */
export const formatWithBiome = (codes: string[]): string[] => {
  if (codes.length === 0) return [];
  const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shuip-format-'));
  try {
    const { files: _files, ...config } = JSON.parse(fs.readFileSync(BIOME_CONFIG, 'utf-8'));
    fs.writeFileSync(path.join(stagingDir, 'biome.json'), JSON.stringify(config));
    for (const [index, code] of codes.entries()) {
      fs.writeFileSync(path.join(stagingDir, `${index}.tsx`), code);
    }
    const result = Bun.spawnSync([BIOME_BIN, 'format', '--write', '.'], { cwd: stagingDir });
    if (result.exitCode !== 0) {
      throw new Error(`[generate] biome could not format the Base UI copies:\n${result.stderr.toString()}`);
    }
    return codes.map((_, index) => fs.readFileSync(path.join(stagingDir, `${index}.tsx`), 'utf-8'));
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
};

export interface BaseSource {
  /** What a consumer installs, with the standard `@/components/ui/*` aliases. */
  code: string;
  origin: 'override' | 'codemod' | 'identical';
  warnings: string[];
}

/** An override wins over the codemod; a canonical file the codemod leaves alone is `identical`. */
export const resolveBaseSource = (canonicalPath: string, overridePath: string | undefined): BaseSource => {
  if (overridePath) {
    return { code: fs.readFileSync(overridePath, 'utf-8'), origin: 'override', warnings: [] };
  }
  const canonical = fs.readFileSync(canonicalPath, 'utf-8');
  const { code, warnings } = toBaseVariant(canonical);
  return { code, origin: code === canonical ? 'identical' : 'codemod', warnings };
};

export interface PathAlias {
  /** A `paths` key of a tsconfig: an exact module specifier, or a prefix followed by `*`. */
  pattern: string;
  /** The absolute target, with the same `*` as the pattern. */
  target: string;
}

/** The `compilerOptions.paths` of a tsconfig, with absolute targets, as TypeScript resolves them through `extends`. */
export const readPathAliases = (tsconfigPath: string): PathAlias[] => {
  const parsed = ts.getParsedCommandLineOfConfigFile(
    tsconfigPath,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
      },
    },
  );
  const { baseUrl, pathsBasePath, paths = {} } = parsed?.options ?? {};
  const baseDir = baseUrl ?? (pathsBasePath as string);
  return Object.entries(paths).map(([pattern, [target]]) => ({
    pattern,
    target: path.resolve(baseDir, target as string),
  }));
};

export interface Relocation {
  from: string;
  to: string;
}

export interface AliasTargets {
  /** The aliases of the canonical sources. */
  aliases: PathAlias[];
  /** Moves the targets that differ for the Base UI copies, such as the primitives and the stubs. */
  relocations: Relocation[];
}

export const relocate = (target: string, relocations: Relocation[]): string => {
  const relocation = relocations.find(({ from }) => target === from || target.startsWith(`${from}${path.sep}`));
  return relocation ? `${relocation.to}${target.slice(relocation.from.length)}` : target;
};

const MODULE_SPECIFIER = /(\bfrom\s+|\bimport\s*\(?\s*)(['"])(@\/[^'"]+)\2/g;

const importPath = (fromFile: string, target: string): string => {
  const relative = path.relative(path.dirname(fromFile), target).split(path.sep).join('/');
  return relative.startsWith('.') ? relative : `./${relative}`;
};

// The most specific alias wins, like the module resolution of TypeScript.
const aliasTarget = (specifier: string, { aliases, relocations }: AliasTargets): string | undefined => {
  let best: { target: string; specificity: number } | undefined;
  for (const { pattern, target } of aliases) {
    const star = pattern.indexOf('*');
    const prefix = star < 0 ? pattern : pattern.slice(0, star);
    const suffix = star < 0 ? '' : pattern.slice(star + 1);
    const matches =
      star < 0
        ? specifier === pattern
        : specifier.length >= pattern.length - 1 && specifier.startsWith(prefix) && specifier.endsWith(suffix);
    if (!matches || (best && best.specificity >= prefix.length)) continue;
    const captured = specifier.slice(prefix.length, specifier.length - suffix.length);
    best = { target: target.replace('*', captured), specificity: prefix.length };
  }
  return best && relocate(best.target, relocations);
};

/** The copy the docs compile: every alias resolves to an explicit path, to a Base UI primitive or stub where it differs. */
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
