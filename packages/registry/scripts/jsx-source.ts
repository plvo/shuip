import ts from 'typescript';

export const parseTsx = (fileName: string, content: string): ts.SourceFile =>
  ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

type JsxElement = ts.JsxOpeningElement | ts.JsxSelfClosingElement;

/** The elements at or under `root` whose tag satisfies `isTag`, in source order. */
export const elementsMatching = (root: ts.Node, isTag: (tag: string) => boolean): JsxElement[] => {
  const found: JsxElement[] = [];
  const visit = (node: ts.Node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && isTag(node.tagName.getText())) {
      found.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(root);
  return found;
};

export const elementsNamed = (source: ts.SourceFile, tag: string): JsxElement[] =>
  elementsMatching(source, (name) => name === tag);

export const importDeclarations = (source: ts.SourceFile, specifier: string): ts.ImportDeclaration[] =>
  source.statements.filter(
    (statement): statement is ts.ImportDeclaration =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === specifier,
  );

/** The named bindings imported from `specifier`: `import { a as b }` gives `{ imported: 'a', local: 'b' }`. */
export const namedImports = (source: ts.SourceFile, specifier: string): { imported: string; local: string }[] =>
  importDeclarations(source, specifier).flatMap((declaration) =>
    declaration.importClause?.namedBindings !== undefined && ts.isNamedImports(declaration.importClause.namedBindings)
      ? declaration.importClause.namedBindings.elements.map((element) => ({
          imported: (element.propertyName ?? element.name).text,
          local: element.name.text,
        }))
      : [],
  );

/** The source text of the value of attribute `name` on every element `tag`: a string literal keeps its quotes, an expression loses its `{...}` braces. */
export const attributeValues = (source: ts.SourceFile, tag: string, name: string): string[] =>
  elementsNamed(source, tag).flatMap((element) =>
    element.attributes.properties.flatMap((attribute) => {
      if (!ts.isJsxAttribute(attribute) || attribute.name.getText() !== name || attribute.initializer === undefined) {
        return [];
      }
      if (!ts.isJsxExpression(attribute.initializer)) return [attribute.initializer.getText()];
      return attribute.initializer.expression === undefined ? [] : [attribute.initializer.expression.getText()];
    }),
  );

/** The attributes of every element `tag` in source order, a spread shown as `...expression`. */
export const attributeOrder = (source: ts.SourceFile, tag: string): string[][] =>
  elementsNamed(source, tag).map((element) =>
    element.attributes.properties.map((attribute) =>
      ts.isJsxSpreadAttribute(attribute) ? `...${attribute.expression.getText()}` : attribute.name.getText(),
    ),
  );
