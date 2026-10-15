import fs from 'node:fs';
import path from 'node:path';

export const REPOSITORY_ROOT = path.resolve(import.meta.dir, '..', '..', '..');

export interface RepositoryDocument {
  /** The path of the document from the repository root. */
  name: string;
  text: string;
}

/** Every file under `root` whose name ends with one of `extensions`, symbolic links included. */
export const filesUnder = (root: string, extensions: readonly string[]): string[] =>
  fs.readdirSync(root, { recursive: true, withFileTypes: true }).flatMap((entry) => {
    const file = path.join(entry.parentPath, entry.name);
    return (entry.isFile() || entry.isSymbolicLink()) && extensions.some((extension) => file.endsWith(extension))
      ? [file]
      : [];
  });

/** The documents at `files`, read from disk. A file that does not exist is an error. */
export const readDocuments = (files: readonly string[]): RepositoryDocument[] =>
  files.map((file) => ({ name: path.relative(REPOSITORY_ROOT, file), text: fs.readFileSync(file, 'utf-8') }));
