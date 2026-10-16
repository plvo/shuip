import ts from 'typescript';

type JsxElement = ts.JsxOpeningElement | ts.JsxSelfClosingElement;

export const elementsNamed = (source: ts.SourceFile, tag: string): JsxElement[] => {
  const found: JsxElement[] = [];
  const visit = (node: ts.Node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText() === tag) {
      found.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
};

/** The source text of the value of attribute `name` on every element `tag`, `{...}` braces removed. */
export const attributeValues = (source: ts.SourceFile, tag: string, name: string): string[] =>
  elementsNamed(source, tag).flatMap((element) =>
    element.attributes.properties.flatMap((attribute) =>
      ts.isJsxAttribute(attribute) &&
      attribute.name.getText() === name &&
      attribute.initializer !== undefined &&
      ts.isJsxExpression(attribute.initializer) &&
      attribute.initializer.expression !== undefined
        ? [attribute.initializer.expression.getText()]
        : [],
    ),
  );

/** The attributes of every element `tag` in source order, a spread shown as `...expression`. */
export const attributeOrder = (source: ts.SourceFile, tag: string): string[][] =>
  elementsNamed(source, tag).map((element) =>
    element.attributes.properties.map((attribute) =>
      ts.isJsxSpreadAttribute(attribute) ? `...${attribute.expression.getText()}` : attribute.name.getText(),
    ),
  );
