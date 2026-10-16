/**
 * Source-to-source conversion of Radix `asChild` composition into Base UI `render` composition.
 *
 * The `asChild` to `render` rewrite is ported from the `transformAsChild` transformer of shadcn/ui
 * (packages/registry/src/transformers/transform-aschild.ts), MIT License, Copyright (c) 2023 shadcn.
 * It differs on purpose: it edits the TypeScript syntax tree in place instead of printing it, leaves
 * `asChild={expr}` pass-throughs alone, and adds `nativeButton={false}` for every rendered element that
 * is not a button, not only under `Button`.
 *
 * A `Popover` that holds a `PopoverAnchor asChild` is anchored to an element other than a trigger. The vendored
 * Base UI `PopoverContent` cannot take an anchor, so its content is rebuilt from the Base UI parts it is made of:
 * `Portal`, a `Positioner` with `anchor` set to the `ref` of the anchored element, and a `Popup`.
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

// What the vendored Base UI `PopoverContent` puts on the popup (packages/ui/src/components/ui-base/popover.tsx).
const POPUP_CLASSES =
  'z-50 flex w-72 origin-(--transform-origin) flex-col gap-4 rounded-md bg-popover p-4 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95';
const POSITIONER_CLASSES = 'isolate z-50';
const DEFAULT_SIDE_OFFSET = 4;
const POSITIONER_PROPS = new Set(['align', 'alignOffset', 'side', 'sideOffset']);
const FOCUS_PROPS = new Map([
  ['onOpenAutoFocus', 'initialFocus'],
  ['onCloseAutoFocus', 'finalFocus'],
]);
const PREVENT_DEFAULT_HANDLER = /^\{\s*\(\s*(\w+)\s*\)\s*=>\s*\1\.preventDefault\(\)\s*\}$/;
const RADIX_ONLY_CONTENT_PROPS = new Set([
  'asChild',
  'forceMount',
  'avoidCollisions',
  'collisionBoundary',
  'collisionPadding',
  'arrowPadding',
  'sticky',
  'hideWhenDetached',
  'onEscapeKeyDown',
  'onPointerDownOutside',
  'onFocusOutside',
  'onInteractOutside',
]);
const RADIX_TRIGGER_WIDTH = '--radix-popover-trigger-width';
const BASE_ANCHOR_WIDTH = '--anchor-width';
const POPOVER_MODULE = '@/components/ui/popover';
const POPOVER_PRIMITIVE_IMPORT = "import { Popover as PopoverPrimitive } from '@base-ui/react/popover';";
const CN_IMPORT = "import { cn } from '@/lib/utils';";

const isAsChild = (attribute: ts.JsxAttributeLike): attribute is ts.JsxAttribute =>
  ts.isJsxAttribute(attribute) && attribute.name.getText() === 'asChild';

const isElement = (node: ts.Node): node is ts.JsxElement | ts.JsxSelfClosingElement =>
  ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node);

const isBlankText = (node: ts.JsxChild): boolean => ts.isJsxText(node) && node.containsOnlyTriviaWhiteSpaces;

const openingOf = (element: ts.JsxElement | ts.JsxSelfClosingElement): ts.JsxOpeningLikeElement =>
  ts.isJsxElement(element) ? element.openingElement : element;

const singleElementChild = (element: ts.JsxElement): ts.JsxElement | ts.JsxSelfClosingElement | undefined => {
  const [child, ...others] = element.children.filter((node) => !isBlankText(node));
  return child && others.length === 0 && isElement(child) ? child : undefined;
};

export const toBaseVariant = (source: string): BaseVariant => {
  const file = ts.createSourceFile('source.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const warnings: string[] = [];
  const lineOf = (node: ts.Node): number => file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;
  const leadingTriviaOf = (node: ts.Node): string => source.slice(node.pos, node.getStart(file));
  const tagOf = (node: ts.Node): string | undefined =>
    isElement(node) ? openingOf(node).tagName.getText(file) : undefined;
  const nameOf = (attribute: ts.JsxAttributeLike): string | undefined =>
    ts.isJsxAttribute(attribute) ? attribute.name.getText(file) : undefined;

  // Source text of a node with every descendant conversion applied. Children tile their parent's range,
  // so concatenating them gives back the original text wherever nothing is converted.
  const emit = (node: ts.Node): string => {
    const replacement = replacements.get(node);
    if (replacement) return replacement();
    if (ts.isImportDeclaration(node)) return emitImport(node);
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
    const child = singleElementChild(element);
    if (!child) {
      warnings.push(
        `line ${lineOf(element)}: asChild on <${parentTag}> is left as is, its child is not a single element`,
      );
      return undefined;
    }

    const childOpening = openingOf(child);
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
    const leadingTrivia = leadingTriviaOf(element);
    return childChildren.trim() === ''
      ? `${leadingTrivia}<${opening} />`
      : `${leadingTrivia}<${opening}>${childChildren}</${parentTag}>`;
  };

  const attributeText = (attribute: ts.JsxAttributeLike): string =>
    emit(attribute).trim().replaceAll(RADIX_TRIGGER_WIDTH, BASE_ANCHOR_WIDTH);

  // A Radix focus handler maps to a Base UI focus prop only when it just prevents the default.
  const unsupportedContentProp = (attribute: ts.JsxAttributeLike): string | undefined => {
    const name = nameOf(attribute);
    if (name === undefined) return undefined;
    if (RADIX_ONLY_CONTENT_PROPS.has(name)) return name;
    const preventsDefault =
      ts.isJsxAttribute(attribute) &&
      attribute.initializer !== undefined &&
      PREVENT_DEFAULT_HANDLER.test(attribute.initializer.getText(file));
    return FOCUS_PROPS.has(name) && !preventsDefault ? name : undefined;
  };

  const popupAttribute = (attribute: ts.JsxAttributeLike): string => {
    const name = nameOf(attribute);
    const focusProp = name === undefined ? undefined : FOCUS_PROPS.get(name);
    if (focusProp) return `${focusProp}={false}`;
    if (name !== 'className' || !ts.isJsxAttribute(attribute) || !attribute.initializer)
      return attributeText(attribute);
    const { initializer } = attribute;
    const extraClasses = ts.isJsxExpression(initializer)
      ? initializer.expression && emit(initializer.expression).trim()
      : initializer.getText(file);
    return `className={cn('${POPUP_CLASSES}', ${extraClasses})}`;
  };

  const anchoredContent = (content: ts.JsxElement, anchorRef: string): string => {
    const attributes = content.openingElement.attributes.properties;
    const isPositionerProp = (attribute: ts.JsxAttributeLike) => POSITIONER_PROPS.has(nameOf(attribute) ?? '');
    const hasProp = (name: string) => attributes.some((attribute) => nameOf(attribute) === name);

    const positioner = [`anchor={${anchorRef}}`, ...attributes.filter(isPositionerProp).map(attributeText)];
    if (!hasProp('sideOffset')) positioner.push(`sideOffset={${DEFAULT_SIDE_OFFSET}}`);
    positioner.push(`className='${POSITIONER_CLASSES}'`);

    const popup = [
      "data-slot='popover-content'",
      ...attributes.filter((a) => !isPositionerProp(a)).map(popupAttribute),
    ];
    if (!hasProp('className')) popup.push(`className='${POPUP_CLASSES}'`);

    const children = content.children.map(emit).join('');
    return `${leadingTriviaOf(content)}<PopoverPrimitive.Portal><PopoverPrimitive.Positioner ${positioner.join(' ')}><PopoverPrimitive.Popup ${popup.join(' ')}>${children}</PopoverPrimitive.Popup></PopoverPrimitive.Positioner></PopoverPrimitive.Portal>`;
  };

  // Searches a Popover without entering the Popovers nested in it.
  const elementsIn = (popover: ts.JsxElement, tag: string): ts.JsxElement[] => {
    const found: ts.JsxElement[] = [];
    const visit = (node: ts.Node) => {
      if (node !== popover && ts.isJsxElement(node) && tagOf(node) === 'Popover') return;
      if (ts.isJsxElement(node) && tagOf(node) === tag) found.push(node);
      ts.forEachChild(node, visit);
    };
    visit(popover);
    return found;
  };

  const anchorRefOf = (element: ts.JsxElement | ts.JsxSelfClosingElement): ts.Expression | undefined => {
    const attribute = openingOf(element).attributes.properties.find(
      (candidate): candidate is ts.JsxAttribute => ts.isJsxAttribute(candidate) && nameOf(candidate) === 'ref',
    );
    const expression =
      attribute?.initializer && ts.isJsxExpression(attribute.initializer)
        ? attribute.initializer.expression
        : undefined;
    return expression && (ts.isIdentifier(expression) || ts.isPropertyAccessExpression(expression))
      ? expression
      : undefined;
  };

  const replacements = new Map<ts.Node, () => string>();
  let anchorsRebuilt = 0;
  let contentsRebuilt = 0;
  let mergesClassName = false;

  const planAnchoredPopover = (popover: ts.JsxElement) => {
    const [anchor, ...otherAnchors] = elementsIn(popover, 'PopoverAnchor');
    if (!anchor) return;
    const contents = elementsIn(popover, 'PopoverContent');
    const [content] = contents;
    const leaveAsIs = (node: ts.Node, tag: string, reason: string) =>
      warnings.push(`line ${lineOf(node)}: ${tag} is left as is, ${reason}`);

    if (!content || contents.length > 1 || otherAnchors.length > 0) {
      return leaveAsIs(anchor, 'PopoverAnchor', 'its Popover does not hold exactly one anchor and one content');
    }
    const asChild = anchor.openingElement.attributes.properties.find(isAsChild);
    const anchored = singleElementChild(anchor);
    if (!asChild || asChild.initializer || !anchored) {
      return leaveAsIs(anchor, 'PopoverAnchor', 'it is not an asChild around a single element');
    }
    const anchorRef = anchorRefOf(anchored);
    if (!anchorRef) return leaveAsIs(anchor, 'PopoverAnchor', 'its child has no ref to anchor the popup to');
    const unsupported = content.openingElement.attributes.properties.map(unsupportedContentProp).find(Boolean);
    if (unsupported) return leaveAsIs(content, 'PopoverContent', `${unsupported} has no Base UI equivalent`);

    replacements.set(anchor, () => `${leadingTriviaOf(anchor)}${emit(anchored)}`);
    replacements.set(content, () => anchoredContent(content, anchorRef.getText(file)));
    anchorsRebuilt++;
    contentsRebuilt++;
    mergesClassName ||= content.openingElement.attributes.properties.some((a) => nameOf(a) === 'className');
  };

  const planAnchoredPopovers = (node: ts.Node) => {
    if (ts.isJsxElement(node) && tagOf(node) === 'Popover') planAnchoredPopover(node);
    ts.forEachChild(node, planAnchoredPopovers);
  };

  const countElements = (tag: string): number => {
    let count = 0;
    const visit = (node: ts.Node) => {
      if (tagOf(node) === tag) count++;
      ts.forEachChild(node, visit);
    };
    visit(file);
    return count;
  };

  // The anchored parts are no longer used from the vendored popover once every one of them is rebuilt.
  const unusedPopoverImports = (): Set<string> => {
    const unused = new Set<string>();
    if (anchorsRebuilt > 0 && countElements('PopoverAnchor') === anchorsRebuilt) unused.add('PopoverAnchor');
    if (contentsRebuilt > 0 && countElements('PopoverContent') === contentsRebuilt) unused.add('PopoverContent');
    return unused;
  };

  const imports = file.statements.filter(ts.isImportDeclaration);
  const importsCn = imports.some((declaration) => {
    const bindings = declaration.importClause?.namedBindings;
    return bindings && ts.isNamedImports(bindings) && bindings.elements.some((element) => element.name.text === 'cn');
  });
  const addedImports = (): string =>
    [POPOVER_PRIMITIVE_IMPORT, ...(mergesClassName && !importsCn ? [CN_IMPORT] : [])].join('\n');

  const emitImport = (declaration: ts.ImportDeclaration): string => {
    const bindings = declaration.importClause?.namedBindings;
    const original = source.slice(declaration.pos, declaration.end);
    const isLastImport = declaration === imports.at(-1);
    const withAdded = (text: string) => (isLastImport && anchorsRebuilt > 0 ? `${text}\n${addedImports()}` : text);

    const unused = unusedPopoverImports();
    const isPopoverImport =
      ts.isStringLiteral(declaration.moduleSpecifier) && declaration.moduleSpecifier.text === POPOVER_MODULE;
    if (!isPopoverImport || !bindings || !ts.isNamedImports(bindings) || unused.size === 0) return withAdded(original);

    const kept = bindings.elements.filter((element) => !unused.has((element.propertyName ?? element.name).text));
    if (kept.length === 0) return withAdded(leadingTriviaOf(declaration));
    const names = kept.map((element) => element.getText(file)).join(', ');
    const rebuilt = `import { ${names} } from ${declaration.moduleSpecifier.getText(file)};`;
    return withAdded(`${leadingTriviaOf(declaration)}${rebuilt}`);
  };

  planAnchoredPopovers(file);
  const code = emit(file);
  return { code: imports.length === 0 && anchorsRebuilt > 0 ? `${addedImports()}\n${code}` : code, warnings };
};
