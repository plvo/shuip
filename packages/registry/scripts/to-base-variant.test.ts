import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { RADIX_ONLY_CONTENT_PROPS, toBaseVariant } from './to-base-variant';

const lines = (...rows: string[]): string => `${rows.join('\n')}\n`;
const compact = (code: string): string => code.replace(/\s+/g, ' ').trim();

const VENDORED_POPOVER = fs.readFileSync(
  path.resolve(import.meta.dir, '../../ui/src/components/ui-base/popover.tsx'),
  'utf-8',
);

// What the codemod copies from the vendored PopoverContent. A change of its shape fails here with this message.
const vendoredPopover = () => {
  const popupClasses = VENDORED_POPOVER.match(/"(z-50 flex w-72[^"]*)"/)?.[1];
  const positionerClasses = VENDORED_POPOVER.match(/<PopoverPrimitive\.Positioner[^>]*?className="([^"]*)"/)?.[1];
  const sideOffset = VENDORED_POPOVER.match(/sideOffset = (\d+),/)?.[1];
  if (popupClasses === undefined || positionerClasses === undefined || sideOffset === undefined) {
    throw new Error(
      'ui-base/popover.tsx no longer has the PopoverContent that the anchored popover codemod copies: update POPUP_CLASSES, POSITIONER_CLASSES and DEFAULT_SIDE_OFFSET in to-base-variant.ts, then this reader',
    );
  }
  return { popupClasses, positionerClasses, sideOffset };
};

describe('toBaseVariant', () => {
  test('turns asChild composition into a render prop and moves the children to the parent', () => {
    const input = lines(
      'export const Demo = () => (',
      '  <PopoverTrigger asChild>',
      "    <Button variant='outline'>Open</Button>",
      '  </PopoverTrigger>',
      ');',
    );

    const { code, warnings } = toBaseVariant(input);

    expect(code).toBe(
      lines(
        'export const Demo = () => (',
        "  <PopoverTrigger render={<Button variant='outline' />}>Open</PopoverTrigger>",
        ');',
      ),
    );
    expect(warnings).toEqual([]);
  });

  test('closes the parent when the child has no children', () => {
    const input = lines('<DialogClose asChild>', '  <Button variant="ghost" />', '</DialogClose>');

    expect(toBaseVariant(input).code).toBe('<DialogClose render={<Button variant="ghost" />} />\n');
  });

  test('keeps the parent props around the rendered element, in their original order', () => {
    const input = lines(
      '<PopoverTrigger className="x" asChild {...props}>',
      '  <Button>Go</Button>',
      '</PopoverTrigger>',
    );

    expect(toBaseVariant(input).code).toBe(
      '<PopoverTrigger className="x" render={<Button />} {...props}>Go</PopoverTrigger>\n',
    );
  });

  test.each([
    ['div', '<div className="relative">Hi</div>'],
    ['span', '<span>Hi</span>'],
    ['label', '<label>Hi</label>'],
    ['icon component', '<InfoIcon />'],
  ])('adds nativeButton={false} when the rendered element is a %s', (_, child) => {
    const input = lines('<PopoverTrigger asChild>', `  ${child}`, '</PopoverTrigger>');

    const { code } = toBaseVariant(input);

    expect(code).toContain(' nativeButton={false}');
    expect(code).not.toContain('asChild');
  });

  test.each([
    ['button', '<button type="button">Hi</button>'],
    ['Button', '<Button>Hi</Button>'],
    ['InputGroupButton', '<InputGroupButton>Hi</InputGroupButton>'],
  ])('leaves nativeButton alone when the rendered element is a %s', (_, child) => {
    const input = lines('<PopoverTrigger asChild>', `  ${child}`, '</PopoverTrigger>');

    expect(toBaseVariant(input).code).not.toContain('nativeButton');
  });

  test.each([
    ['ButtonGroup', '<ButtonGroup>Hi</ButtonGroup>'],
    ['ButtonLink', '<ButtonLink href="/x">Hi</ButtonLink>'],
  ])('adds nativeButton={false} for %s, whose name only contains Button', (_, child) => {
    const input = lines('<PopoverTrigger asChild>', `  ${child}`, '</PopoverTrigger>');

    expect(toBaseVariant(input).code).toContain(' nativeButton={false}');
  });

  test('renders a custom component whose name ends in Button with its props and without nativeButton', () => {
    const input = lines(
      '<DialogTrigger asChild>',
      "  <FilterMenuButton label='x' count={count} />",
      '</DialogTrigger>',
    );

    const { code, warnings } = toBaseVariant(input);

    expect(code).toBe("<DialogTrigger render={<FilterMenuButton label='x' count={count} />} />\n");
    expect(warnings).toEqual([]);
  });

  test('adds nativeButton={false} to a custom component whose name does not end in Button', () => {
    const input = lines('<DialogTrigger asChild>', "  <FilterMenuChip label='x' />", '</DialogTrigger>');

    expect(toBaseVariant(input).code).toBe(
      "<DialogTrigger render={<FilterMenuChip label='x' />} nativeButton={false} />\n",
    );
  });

  test('does not put nativeButton on triggers that do not take it', () => {
    const input = lines('<TooltipTrigger asChild>', '  <span>Hi</span>', '</TooltipTrigger>');

    expect(toBaseVariant(input).code).toBe('<TooltipTrigger render={<span />}>Hi</TooltipTrigger>\n');
  });

  test('converts nested asChild from the inside out', () => {
    const input = lines(
      '<TooltipTrigger asChild>',
      '  <Button>',
      '    <PopoverTrigger asChild>',
      '      <span>Inner</span>',
      '    </PopoverTrigger>',
      '  </Button>',
      '</TooltipTrigger>',
    );

    const { code } = toBaseVariant(input);

    expect(code).not.toContain('asChild');
    expect(code).toContain('<TooltipTrigger render={<Button />}>');
    expect(code).toContain('<PopoverTrigger render={<span />} nativeButton={false}>Inner</PopoverTrigger>');
  });

  test('leaves an asChild pass-through untouched', () => {
    const input = lines(
      'export function Trigger({ asChild, children, ...props }: Props) {',
      '  return (',
      '    <DrawerTrigger asChild={asChild} {...props}>',
      '      {children}',
      '    </DrawerTrigger>',
      '  );',
      '}',
    );

    const { code, warnings } = toBaseVariant(input);

    expect(code).toBe(input);
    expect(warnings).toEqual([]);
  });

  test('returns a file without asChild byte for byte', () => {
    const input = lines(
      "'use client';",
      '',
      "import * as React from 'react';",
      '',
      '// kept as is',
      'export function Plain({ label }: { label: string }) {',
      "  return <div className={cn('a', label)}>{label}</div>;",
      '}',
    );

    expect(toBaseVariant(input)).toEqual({ code: input, warnings: [] });
  });

  test('warns, and leaves the file as it is, when asChild wraps something that is not a single element', () => {
    const input = lines('<DialogTrigger asChild>', '  {trigger}', '</DialogTrigger>');

    const { code, warnings } = toBaseVariant(input);

    expect(code).toBe(input);
    expect(warnings).toEqual(['line 1: asChild on <DialogTrigger> is left as is, its child is not a single element']);
  });

  test.each([
    ['text', 'Or type it'],
    ['an element', '<Icon />'],
  ])('warns, and leaves the file as it is, when the single element has %s next to it', (_, sibling) => {
    const input = lines('<DialogTrigger asChild>', '  <Button>Open</Button>', `  ${sibling}`, '</DialogTrigger>');

    const { code, warnings } = toBaseVariant(input);

    expect(code).toBe(input);
    expect(warnings).toEqual(['line 1: asChild on <DialogTrigger> is left as is, its child is not a single element']);
  });

  test('reports the line of an unconverted asChild that is not on the first line', () => {
    const input = lines(
      'const a = 1;',
      '',
      'const b = (',
      '  <DialogTrigger asChild>',
      '    {trigger}',
      '  </DialogTrigger>',
      ');',
    );

    expect(toBaseVariant(input).warnings).toEqual([
      'line 4: asChild on <DialogTrigger> is left as is, its child is not a single element',
    ]);
  });

  test('reports the line of a link that is not on the first line', () => {
    const input = lines('const a = 1;', '<PopoverTrigger asChild>', '  <a href="/x">Go</a>', '</PopoverTrigger>');

    expect(toBaseVariant(input).warnings).toEqual([
      'line 2: <PopoverTrigger> renders <a> with nativeButton={false}, which Base UI discourages for links; use buttonVariants on a plain anchor',
    ]);
  });

  test.each([
    [
      'closes itself',
      lines('const a = (', '  // closes', '  <DialogClose asChild>', '    <Button />', '  </DialogClose>', ');'),
      lines('const a = (', '  // closes', '  <DialogClose render={<Button />} />', ');'),
    ],
    [
      'has children',
      lines(
        'const a = (',
        '  // wraps',
        '  <DialogTrigger asChild>',
        '    <Button>Open</Button>',
        '  </DialogTrigger>',
        ');',
      ),
      lines('const a = (', '  // wraps', '  <DialogTrigger render={<Button />}>Open</DialogTrigger>', ');'),
    ],
  ])('keeps the comment and indentation before a converted element that %s', (_, input, expected) => {
    expect(toBaseVariant(input).code).toBe(expected);
  });

  test.each([
    ['a', '<a href="/docs">Docs</a>'],
    ['Link', '<Link href="/docs">Docs</Link>'],
  ])('warns when a %s is rendered with nativeButton={false}', (tag, child) => {
    const input = lines('<PopoverTrigger asChild>', `  ${child}`, '</PopoverTrigger>');

    const { code, warnings } = toBaseVariant(input);

    expect(code).toContain('nativeButton={false}');
    expect(warnings).toEqual([
      `line 1: <PopoverTrigger> renders <${tag}> with nativeButton={false}, which Base UI discourages for links; use buttonVariants on a plain anchor`,
    ]);
  });
});

describe('toBaseVariant on a popover anchored to another element', () => {
  const popover = (anchor: string[], content: string[]): string =>
    lines(
      "import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';",
      "import { cn } from '@/lib/utils';",
      '',
      'export const Demo = () => (',
      '  <Popover open={open}>',
      ...anchor,
      ...content,
      '  </Popover>',
      ');',
    );
  const anchored = [
    '<PopoverAnchor asChild>',
    '  <div ref={boxRef} className="box"><input /></div>',
    '</PopoverAnchor>',
  ];
  const content = (...attributes: string[]): string[] => [
    '<PopoverContent',
    ...attributes.map((attribute) => `  ${attribute}`),
    '>',
    '  <List />',
    '</PopoverContent>',
  ];

  test('anchors the Base UI positioner to the ref of the anchored element, which stays alone in the tree', () => {
    const input = popover(
      anchored,
      content(
        "align='start'",
        'sideOffset={8}',
        "className='p-0'",
        'onOpenAutoFocus={(e) => e.preventDefault()}',
        "style={{ width: 'var(--radix-popover-trigger-width)' }}",
      ),
    );

    const { code, warnings } = toBaseVariant(input);
    const { popupClasses } = vendoredPopover();

    expect(compact(code)).toBe(
      compact(
        lines(
          "import { Popover as PopoverPrimitive } from '@base-ui/react/popover';",
          "import { Popover } from '@/components/ui/popover';",
          "import { cn } from '@/lib/utils';",
          '',
          'export const Demo = () => (',
          '  <Popover open={open}>',
          '<div ref={boxRef} className="box"><input /></div>',
          "<PopoverPrimitive.Portal><PopoverPrimitive.Positioner anchor={boxRef} align='start' sideOffset={8}",
          "className='isolate z-50'><PopoverPrimitive.Popup data-slot='popover-content'",
          `className={cn('${popupClasses}', 'p-0')}`,
          'initialFocus={false}',
          "style={{ width: 'var(--anchor-width)' }}>",
          '<List />',
          '</PopoverPrimitive.Popup></PopoverPrimitive.Positioner></PopoverPrimitive.Portal>',
          '  </Popover>',
          ');',
        ),
      ),
    );
    expect(warnings).toEqual([]);
  });

  test('copies the classes and the default offset that the vendored PopoverContent gives its parts', () => {
    const { popupClasses, positionerClasses, sideOffset } = vendoredPopover();

    const { code } = toBaseVariant(popover(anchored, content()));

    expect(code).toContain(`className='${popupClasses}'`);
    expect(compact(code)).toContain(`anchor={boxRef} sideOffset={${sideOffset}} className='${positionerClasses}'`);
  });

  test('keeps a className expression after the vendored classes and imports cn only when it is missing', () => {
    const withExpression = popover(anchored, content('className={listboxClassName}'));
    const withoutCn = withExpression.replace("import { cn } from '@/lib/utils';\n", '');

    expect(toBaseVariant(withExpression).code).toContain(`cn('${vendoredPopover().popupClasses}', listboxClassName)`);
    expect(toBaseVariant(withExpression).code.match(/import \{ cn \}/g)).toHaveLength(1);
    expect(toBaseVariant(withoutCn).code).toContain("import { cn } from '@/lib/utils';");
  });

  test.each([
    ['onOpenAutoFocus', 'initialFocus'],
    ['onCloseAutoFocus', 'finalFocus'],
  ])('maps %s={(e) => e.preventDefault()} to %s={false} and nothing else', (radixProp, baseProp) => {
    const { code } = toBaseVariant(popover(anchored, content(`${radixProp}={(e) => e.preventDefault()}`)));

    expect(code).toContain(`${baseProp}={false}`);
    expect(code.match(/(?:initial|final)Focus/g)).toHaveLength(1);
    expect(code).not.toContain(radixProp);
  });

  test('keeps the other props of the content on the popup, a ref and a spread included', () => {
    const { code } = toBaseVariant(popover(anchored, content('ref={listRef}', '{...listProps}', 'onMouseDown={stop}')));

    expect(compact(code)).toContain("<PopoverPrimitive.Popup data-slot='popover-content' ref={listRef} {...listProps}");
    expect(code).toContain('onMouseDown={stop}');
  });

  test('gives the positioner the placement props and the popup the others', () => {
    const { code } = toBaseVariant(popover(anchored, content("side='top'", 'alignOffset={4}', 'onMouseDown={stop}')));

    const positioner = code.match(/<PopoverPrimitive\.Positioner[^>]*>/)?.[0];
    const popup = code.match(/<PopoverPrimitive\.Popup[^>]*>/)?.[0];
    expect(positioner).toContain("side='top'");
    expect(positioner).toContain('alignOffset={4}');
    expect(popup).not.toMatch(/ side=/);
    expect(popup).not.toContain('alignOffset');
    expect(popup).toContain('onMouseDown={stop}');
  });

  test('keeps a popover that is not anchored to another element as it is', () => {
    const plain = lines(
      "import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';",
      '<Popover><PopoverTrigger>Open</PopoverTrigger><PopoverContent align="end">Hi</PopoverContent></Popover>',
    );

    expect(toBaseVariant(plain)).toEqual({ code: plain, warnings: [] });
  });

  test('converts each anchored popover of a file with its own ref', () => {
    const first = popover(['<PopoverAnchor asChild>', '  <span ref={otherRef} />', '</PopoverAnchor>'], content());
    const input = lines(first, first.replace(/otherRef/g, 'thirdRef'));

    const { code } = toBaseVariant(input);

    expect(code).toContain('anchor={otherRef}');
    expect(code).toContain('anchor={thirdRef}');
    expect(code).not.toContain('PopoverAnchor');
  });

  const popoverImport = "import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';";
  const anchoredBy = (ref: string) => ['<PopoverAnchor asChild>', `  <div ref=${ref} />`, '</PopoverAnchor>'];
  const noRefWarning =
    'line 6: PopoverAnchor is left as is, its child needs ref={name} or ref={object.name} to anchor the popup to';

  test.each([
    [
      'the anchored element has no ref',
      popover(['<PopoverAnchor asChild>', '  <div />', '</PopoverAnchor>'], content()),
    ],
    ['its ref is a callback', popover(anchoredBy('{(element) => setBox(element)}'), content())],
    ['its ref is not a name', popover(anchoredBy('{refs[0]}'), content())],
  ])('warns, and does not anchor the popup, when %s', (_, input) => {
    const { code, warnings } = toBaseVariant(input);

    expect(code).toContain('<PopoverContent');
    expect(code).not.toContain('anchor=');
    expect(code).not.toContain('PopoverPrimitive');
    expect(code).toContain(popoverImport);
    expect(code).not.toContain('@base-ui');
    expect(warnings).toEqual([noRefWarning]);
  });

  test.each([...RADIX_ONLY_CONTENT_PROPS])('warns, and does not rebuild the content, when it has %s', (prop) => {
    const { code, warnings } = toBaseVariant(popover(anchored, content(`${prop}={value}`)));

    expect(code).toContain('<PopoverContent');
    expect(code).not.toContain('PopoverPrimitive');
    expect(code).toContain(popoverImport);
    expect(code).not.toContain('@base-ui');
    expect(warnings).toEqual([`line 9: PopoverContent is left as is, ${prop} has no Base UI equivalent`]);
  });

  test('warns, and does not rebuild the content, when it handles the focus other than by preventing the default', () => {
    const { code, warnings } = toBaseVariant(popover(anchored, content('onOpenAutoFocus={focusList}')));

    expect(code).toContain('<PopoverContent');
    expect(code).not.toContain('@base-ui');
    expect(warnings).toEqual(['line 9: PopoverContent is left as is, onOpenAutoFocus has no Base UI equivalent']);
  });

  describe('imports from the vendored popover', () => {
    const plainPopover = '<Popover><PopoverTrigger>Open</PopoverTrigger><PopoverContent>Hi</PopoverContent></Popover>';
    const importing = (...names: string[]) => `import { ${names.join(', ')} } from '@/components/ui/popover';`;

    test('keeps PopoverContent, and drops PopoverAnchor, while a plain popover still uses PopoverContent', () => {
      const input = lines(
        importing('Popover', 'PopoverAnchor', 'PopoverContent', 'PopoverTrigger'),
        '<Popover>',
        ...anchored,
        ...content(),
        '</Popover>',
        plainPopover,
      );

      const { code, warnings } = toBaseVariant(input);

      expect(code).toContain(importing('Popover', 'PopoverContent', 'PopoverTrigger'));
      expect(code).not.toContain('PopoverAnchor');
      expect(code).toContain('<PopoverContent>Hi</PopoverContent>');
      expect(warnings).toEqual([]);
    });

    test('keeps both imports while an anchored popover falls back', () => {
      const input = lines(
        importing('Popover', 'PopoverAnchor', 'PopoverContent'),
        '<Popover>',
        ...anchored,
        ...content(),
        '</Popover>',
        '<Popover>',
        ...anchoredBy('{(element) => setBox(element)}'),
        ...content(),
        '</Popover>',
      );

      const { code, warnings } = toBaseVariant(input);

      expect(code).toContain(importing('Popover', 'PopoverAnchor', 'PopoverContent'));
      expect(code).toContain('anchor={boxRef}');
      expect(warnings).toHaveLength(1);
    });
  });
});
