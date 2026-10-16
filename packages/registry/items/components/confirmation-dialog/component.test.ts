import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { Loader2Icon } from 'lucide-react';
import { createElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Dialog, DialogClose } from '@/components/ui/dialog';
import {
  ConfirmationDialogView as BaseConfirmationDialogView,
  runConfirmation as baseRunConfirmation,
} from './component.base';
import {
  ConfirmationDialogView as RadixConfirmationDialogView,
  runConfirmation as radixRunConfirmation,
  resolveOpenState,
} from './component.radix';

type AnyElement = ReactElement<{
  children?: ReactNode;
  onClick?: unknown;
  'aria-disabled'?: boolean;
  'aria-label'?: string;
  'aria-busy'?: boolean;
}>;

const subtree = (node: ReactNode): AnyElement[] => {
  if (Array.isArray(node)) return node.flatMap(subtree);
  if (!isValidElement<{ children?: ReactNode }>(node)) return [];
  return [node as AnyElement, ...subtree(node.props.children)];
};

const textOf = (node: ReactNode): string => {
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (typeof node === 'string') return node;
  return isValidElement<{ children?: ReactNode }>(node) ? textOf(node.props.children) : '';
};

const variants = [
  [
    'radix',
    {
      runConfirmation: radixRunConfirmation,
      View: RadixConfirmationDialogView,
      stateProps: { open: true, onOpenChange: () => {} },
    },
  ],
  [
    'base',
    {
      runConfirmation: baseRunConfirmation,
      View: BaseConfirmationDialogView,
      stateProps: { actionsRef: { current: null }, open: true, onOpenChange: () => {} },
    },
  ],
] as const;

const deferred = () => {
  let resolve!: (value?: unknown) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

describe.each(variants)('runConfirmation (%s)', (_variant, { runConfirmation }) => {
  const setup = (onConfirm?: () => unknown, pending = false) => {
    const calls: string[] = [];
    const run = () =>
      runConfirmation({
        pending,
        onConfirm: onConfirm as never,
        setPending: (value) => calls.push(`pending:${value}`),
        close: () => calls.push('close'),
      });
    return { calls, run };
  };

  const unhandled: unknown[] = [];
  const record = (reason: unknown) => unhandled.push(reason);
  beforeEach(() => {
    unhandled.length = 0;
    process.on('unhandledRejection', record);
  });
  afterEach(() => {
    process.off('unhandledRejection', record);
  });

  test('a synchronous onConfirm runs, then closes the dialog without a pending state', () => {
    let confirmed = 0;
    const { calls, run } = setup(() => {
      confirmed++;
    });

    run();

    expect(confirmed).toBe(1);
    expect(calls).toEqual(['close']);
  });

  test('without onConfirm the dialog still closes', () => {
    const { calls, run } = setup();
    run();
    expect(calls).toEqual(['close']);
  });

  test('a pending promise marks the confirmation pending and keeps the dialog open', async () => {
    const { calls, run } = setup(() => deferred().promise);

    run();
    await flushMicrotasks();

    expect(calls).toEqual(['pending:true']);
  });

  test('a confirmation that is already pending does not call onConfirm again', () => {
    let confirmed = 0;
    const { calls, run } = setup(() => {
      confirmed++;
    }, true);

    run();

    expect(confirmed).toBe(0);
    expect(calls).toEqual([]);
  });

  test('a resolved promise closes the dialog, then ends the pending state', async () => {
    const work = deferred();
    const { calls, run } = setup(() => work.promise);

    run();
    work.resolve('done');
    await flushMicrotasks();

    expect(calls).toEqual(['pending:true', 'close', 'pending:false']);
  });

  test('a rejected promise keeps the dialog open, ends the pending state and leaves no unhandled rejection', async () => {
    const work = deferred();
    const { calls, run } = setup(() => work.promise);

    run();
    work.reject(new Error('boom'));
    await flushMicrotasks();

    expect(calls).toEqual(['pending:true', 'pending:false']);
    expect(unhandled).toEqual([]);
  });

  test('a close that throws after a resolved promise leaves no unhandled rejection and ends the pending state', async () => {
    const work = deferred();
    const calls: string[] = [];

    runConfirmation({
      pending: false,
      onConfirm: () => work.promise,
      setPending: (value) => calls.push(`pending:${value}`),
      close: () => {
        throw new Error('close failed');
      },
    });
    work.resolve();
    await flushMicrotasks();

    expect(calls).toEqual(['pending:true', 'pending:false']);
    expect(unhandled).toEqual([]);
  });

  test('a thenable that is not a Promise is awaited too', async () => {
    const calls: string[] = [];
    // biome-ignore lint/suspicious/noThenProperty: the test hands over a thenable that is not a Promise
    const thenable = { then: (onFulfilled: () => void) => onFulfilled() };

    runConfirmation({
      pending: false,
      onConfirm: (() => thenable) as never,
      setPending: (value) => calls.push(`pending:${value}`),
      close: () => calls.push('close'),
    });
    await flushMicrotasks();

    expect(calls).toEqual(['pending:true', 'close', 'pending:false']);
  });
});

describe.each(variants)('ConfirmationDialogView (%s)', (_variant, { View, stateProps }) => {
  const onConfirm = () => {};
  const render = (props: { pending?: boolean; labelCancelButton?: string } = {}) =>
    View({
      ...stateProps,
      trigger: createElement('button', { type: 'button' }),
      labelConfirmButton: 'Go',
      pending: false,
      onConfirm,
      ...props,
    } as never);

  const confirmButtons = (tree: ReactNode) => subtree(tree).filter((element) => element.props.onClick === onConfirm);
  const closes = (tree: ReactNode) => subtree(tree).filter((element) => element.type === DialogClose);

  test('the confirm button is not inside a DialogClose, so only the caller decides when the dialog closes', () => {
    const tree = render({ labelCancelButton: 'Cancel' });

    const insideClose = closes(tree).flatMap((close) => subtree(close));

    expect(confirmButtons(tree)).toHaveLength(1);
    expect(insideClose).not.toContain(confirmButtons(tree)[0]);
    expect(textOf(confirmButtons(tree)[0])).toBe('Go');
  });

  test('the confirm button is enabled and shows no spinner while nothing is pending', () => {
    const [confirm] = confirmButtons(render());

    expect(confirm.props['aria-disabled']).toBe(false);
    expect(confirm.props['aria-busy']).toBe(false);
    expect(subtree(confirm).some((element) => element.type === Loader2Icon)).toBe(false);
  });

  test('the confirm button is flagged disabled and busy, and shows a named spinner while pending', () => {
    const [confirm] = confirmButtons(render({ pending: true }));

    expect(confirm.props['aria-disabled']).toBe(true);
    expect(confirm.props['aria-busy']).toBe(true);
    const spinners = subtree(confirm).filter((element) => element.type === Loader2Icon);
    expect(spinners.map((spinner) => spinner.props['aria-label'])).toEqual(['Loading']);
    expect(textOf(confirm)).toBe('Go');
  });

  test('the cancel button is a DialogClose labelled by labelCancelButton that does not carry the confirm handler', () => {
    const tree = render({ labelCancelButton: 'Nope' });

    const cancels = closes(tree);

    expect(cancels).toHaveLength(1);
    expect(textOf(cancels[0])).toBe('Nope');
    expect(subtree(cancels[0]).some((element) => element.props.onClick === onConfirm)).toBe(false);
  });

  test('renders the children between the header and the footer', () => {
    const note = createElement('p', { role: 'alert' }, 'It failed');
    const tree = render({ children: note } as never);

    expect(subtree(tree)).toContain(note);
  });

  test('without labelCancelButton no cancel button renders', () => {
    expect(closes(render())).toHaveLength(0);
  });
});

describe('ConfirmationDialogView state props', () => {
  test('radix hands the open state and its change handler to the Dialog root', () => {
    const onOpenChange = () => {};
    const tree = RadixConfirmationDialogView({ open: true, onOpenChange, pending: false, onConfirm: () => {} });

    expect(tree.type).toBe(Dialog);
    expect(tree.props).toMatchObject({ open: true, onOpenChange });
  });

  test('base passes open, defaultOpen and onOpenChange through to the Dialog root', () => {
    const onOpenChange = () => {};
    const actionsRef = { current: null };
    const tree = BaseConfirmationDialogView({
      open: true,
      defaultOpen: false,
      onOpenChange,
      actionsRef,
      pending: false,
      onConfirm: () => {},
    }) as AnyElement;

    expect(tree.type).toBe(Dialog);
    expect(tree.props).toMatchObject({ open: true, defaultOpen: false, onOpenChange, actionsRef });
  });
});

describe('resolveOpenState', () => {
  const setup = (open: boolean | undefined, localOpen: boolean) => {
    const calls: string[] = [];
    const state = resolveOpenState({
      open,
      localOpen,
      setLocalOpen: (next) => calls.push(`local:${next}`),
      onOpenChange: (next) => calls.push(`notify:${next}`),
    });
    return { calls, ...state };
  };

  test('uses its own state when the open prop is absent, and notifies the caller of a change', () => {
    const { open, setOpen, calls } = setup(undefined, true);

    setOpen(false);

    expect(open).toBe(true);
    expect(calls).toEqual(['local:false', 'notify:false']);
  });

  test('defers to the open prop and leaves its own state alone when controlled', () => {
    const { open, setOpen, calls } = setup(false, true);

    setOpen(true);

    expect(open).toBe(false);
    expect(calls).toEqual(['notify:true']);
  });

  test('changes its own state without a caller handler', () => {
    const calls: string[] = [];
    const { setOpen } = resolveOpenState({
      localOpen: false,
      setLocalOpen: (next) => calls.push(`local:${next}`),
    });

    setOpen(true);

    expect(calls).toEqual(['local:true']);
  });
});
