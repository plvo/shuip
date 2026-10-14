import { describe, expect, test } from 'bun:test';
import { toBaseVariant } from './to-base-variant';

const lines = (...rows: string[]): string => `${rows.join('\n')}\n`;

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
