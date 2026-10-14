/**
 * Source-to-source conversion of Radix `asChild` composition into Base UI `render` composition.
 *
 * The `asChild` to `render` rewrite is ported from the `transformAsChild` transformer of shadcn/ui
 * (packages/registry/src/transformers/transform-aschild.ts), MIT License, Copyright (c) 2023 shadcn.
 * It differs on purpose: it edits the TypeScript syntax tree in place instead of printing it, leaves
 * `asChild={expr}` pass-throughs alone, and adds `nativeButton={false}` for every rendered element that
 * is not a button, not only under `Button`.
 */
import ts from 'typescript';

export interface BaseVariant {
  code: string;
  warnings: string[];
}

// Base UI triggers that render any element and so have no `nativeButton` prop.
const TRIGGERS_WITHOUT_NATIVE_BUTTON = new Set(['TooltipTrigger', 'HoverCardTrigger']);
const LINK_TAGS = new Set(['a', 'Link']);
const BUTTON_TAG = /^button$|Button$/;

const isAsChild = (attribute: ts.JsxAttributeLike): attribute is ts.JsxAttribute =>
  ts.isJsxAttribute(attribute) && attribute.name.getText() === 'asChild';

const isElement = (node: ts.Node): node is ts.JsxElement | ts.JsxSelfClosingElement =>
  ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node);

const isBlankText = (node: ts.JsxChild): boolean => ts.isJsxText(node) && node.containsOnlyTriviaWhiteSpaces;

export const toBaseVariant = (source: string): BaseVariant => {
  const file = ts.createSourceFile('source.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const warnings: string[] = [];
  const lineOf = (node: ts.Node): number => file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;

  // Source text of a node with every descendant conversion applied. Children tile their parent's range,
  // so concatenating them gives back the original text wherever nothing is converted.
  const emit = (node: ts.Node): string => {
    if (ts.isJsxElement(node)) {
      const converted = convert(node);
      if (converted !== undefined) return converted;
    }
    const children = node.getChildren(file);
    return children.length === 0 ? source.slice(node.pos, node.end) : children.map(emit).join('');
  };

  const convert = (element: ts.JsxElement): string | undefined => {
    const { tagName, attributes } = element.openingElement;
    const asChild = attributes.properties.find(isAsChild);
    if (!asChild || asChild.initializer) return undefined;

    const parentTag = tagName.getText(file);
    const [child, ...others] = element.children.filter((node) => !isBlankText(node));
    if (!child || others.length > 0 || !isElement(child)) {
      warnings.push(
        `line ${lineOf(element)}: asChild on <${parentTag}> is left as is, its child is not a single element`,
      );
      return undefined;
    }

    const childOpening = ts.isJsxElement(child) ? child.openingElement : child;
    const childTag = childOpening.tagName.getText(file);
    const childAttributes = childOpening.attributes.properties.map((attribute) => emit(attribute).trim());
    const childChildren = ts.isJsxElement(child) ? child.children.map(emit).join('') : '';
    const needsNativeButton = !BUTTON_TAG.test(childTag) && !TRIGGERS_WITHOUT_NATIVE_BUTTON.has(parentTag);
    if (needsNativeButton && LINK_TAGS.has(childTag)) {
      warnings.push(
        `line ${lineOf(element)}: <${parentTag}> renders <${childTag}> with nativeButton={false}, which Base UI discourages for links; use buttonVariants on a plain anchor`,
      );
    }

    const render = `render={<${[childTag, ...childAttributes].join(' ')} />}`;
    const replacement = needsNativeButton ? `${render} nativeButton={false}` : render;
    const parentAttributes = attributes.properties.map((attribute) =>
      attribute === asChild ? replacement : emit(attribute).trim(),
    );
    const opening = [parentTag, ...parentAttributes].join(' ');
    const leadingTrivia = source.slice(element.pos, element.getStart(file));
    return childChildren.trim() === ''
      ? `${leadingTrivia}<${opening} />`
      : `${leadingTrivia}<${opening}>${childChildren}</${parentTag}>`;
  };

  return { code: emit(file), warnings };
};
