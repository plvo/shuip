import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export const REPOSITORY_ROOT = path.resolve(import.meta.dir, '..', '..', '..');
const SRC_DIR = path.resolve(import.meta.dir, '..', 'src');

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

/** The non-test `.tsx` files of the docs app. */
export const tsxSourceFiles = (): string[] => filesUnder(SRC_DIR, ['.tsx']).filter((file) => !file.includes('.test.'));

/** The TSX file at `file`, parsed. */
export const parseTsx = (file: string): ts.SourceFile =>
  ts.createSourceFile(file, fs.readFileSync(file, 'utf-8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

/** The attribute names of a JSX element, with `...spread` standing for each spread attribute. */
export const attributeNames = (element: ts.JsxOpeningLikeElement): string[] =>
  element.attributes.properties.flatMap((attribute) =>
    ts.isJsxAttribute(attribute) ? [attribute.name.getText()] : ['...spread'],
  );

/** The opening elements named `tagName` in the file, in source order. */
export const elementsNamed = (source: ts.SourceFile, tagName: string): ts.JsxOpeningLikeElement[] => {
  const found: ts.JsxOpeningLikeElement[] = [];
  const visit = (node: ts.Node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText() === tagName) {
      found.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};
