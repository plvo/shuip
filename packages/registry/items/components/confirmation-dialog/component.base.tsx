'use client';

import { Loader2Icon } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface ConfirmationDialogProps
  extends Pick<React.ComponentProps<typeof Dialog>, 'open' | 'defaultOpen' | 'onOpenChange'> {
  trigger?: React.ReactElement;
  nativeButton?: boolean;
  title?: string;
  description?: string;
  labelConfirmButton?: string;
  labelCancelButton?: string;
  children?: React.ReactNode;
  // biome-ignore lint/suspicious/noConfusingVoidType: a callback may return nothing or a promise
  onConfirm?: () => void | PromiseLike<unknown>;
}

interface ConfirmationRun {
  pending: boolean;
  onConfirm?: ConfirmationDialogProps['onConfirm'];
  setPending: (pending: boolean) => void;
  close: () => void;
}

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as PromiseLike<unknown> | undefined)?.then === 'function';

/** Exported for the tests of the item. */
export function runConfirmation({ pending, onConfirm, setPending, close }: ConfirmationRun): void {
  if (pending) return;
  const result = onConfirm?.();
  if (!isPromiseLike(result)) {
    close();
    return;
  }
  setPending(true);
  void Promise.resolve(result)
    .then(close)
    .catch(() => {})
    .finally(() => setPending(false));
}

type DialogActionsRef = NonNullable<React.ComponentProps<typeof Dialog>['actionsRef']>;

/** Exported for the tests of the item. */
export interface ConfirmationDialogViewProps extends Omit<ConfirmationDialogProps, 'onConfirm'> {
  actionsRef: DialogActionsRef;
  pending: boolean;
  onConfirm: () => void;
}

/** Exported for the tests of the item. */
export function ConfirmationDialogView({
  trigger,
  nativeButton,
  title,
  description,
  labelConfirmButton,
  labelCancelButton,
  children,
  actionsRef,
  pending,
  onConfirm,
  ...props
}: ConfirmationDialogViewProps) {
  return (
    <Dialog actionsRef={actionsRef} {...props}>
      {trigger && <DialogTrigger render={trigger} nativeButton={nativeButton} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className='md:text-left'>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          {labelCancelButton && <DialogClose render={<Button variant='outline' />}>{labelCancelButton}</DialogClose>}
          <Button
            onClick={onConfirm}
            aria-disabled={pending}
            aria-busy={pending}
            className='aria-disabled:pointer-events-none aria-disabled:opacity-50'
          >
            {pending && <Loader2Icon data-icon='inline-start' className='animate-spin' aria-label='Loading' />}
            {labelConfirmButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmationDialog({ onConfirm, ...props }: ConfirmationDialogProps) {
  const [pending, setPending] = React.useState(false);
  const actionsRef: DialogActionsRef = React.useRef(null);

  return (
    <ConfirmationDialogView
      {...props}
      actionsRef={actionsRef}
      pending={pending}
      onConfirm={() => runConfirmation({ pending, onConfirm, setPending, close: () => actionsRef.current?.close() })}
    />
  );
}
