import { describe, expect, test } from 'bun:test';
import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Dialog, DialogClose } from '@/components/ui/dialog';
import { ConfirmationDialog as BaseConfirmationDialog } from './component.base';
import { ConfirmationDialog as RadixConfirmationDialog } from './component.radix';

type AnyElement = ReactElement<{ children?: ReactNode; onClick?: unknown }>;

const subtree = (node: ReactNode): AnyElement[] => {
  if (Array.isArray(node)) return node.flatMap(subtree);
  if (!isValidElement<{ children?: ReactNode }>(node)) return [];
  return [node as AnyElement, ...subtree(node.props.children)];
};

const variants = [
  ['radix', RadixConfirmationDialog],
  ['base', BaseConfirmationDialog],
] as const;

describe.each(variants)('ConfirmationDialog (%s)', (_variant, ConfirmationDialog) => {
  test('the confirm action sits inside the DialogClose that closes the dialog', () => {
    const onConfirm = () => {};
    const tree = ConfirmationDialog({
      trigger: createElement('button', { type: 'button' }),
      labelConfirmButton: 'Go',
      onConfirm,
    });

    const confirmers = subtree(tree).filter((element) => element.props.onClick === onConfirm);
    const insideClose = subtree(tree)
      .filter((element) => element.type === DialogClose)
      .flatMap((close) => subtree(close));

    expect(confirmers).toHaveLength(1);
    expect(insideClose).toContain(confirmers[0]);
  });

  test('the dialog state props reach the Dialog root', () => {
    const onOpenChange = () => {};
    const tree = ConfirmationDialog({ open: true, defaultOpen: false, onOpenChange }) as AnyElement;

    expect(tree.type).toBe(Dialog);
    expect(tree.props).toMatchObject({ open: true, defaultOpen: false, onOpenChange });
  });
});
