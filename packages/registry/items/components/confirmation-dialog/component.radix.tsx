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
  trigger?: React.ReactNode;
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

interface OpenState {
  open?: boolean;
  localOpen: boolean;
  setLocalOpen: (open: boolean) => void;
  onOpenChange?: (open: boolean) => void;
}

/** Exported for the tests of the item. */
export function resolveOpenState({ open, localOpen, setLocalOpen, onOpenChange }: OpenState) {
  const setOpen = (next: boolean) => {
    if (open === undefined) setLocalOpen(next);
    onOpenChange?.(next);
  };
  return { open: open ?? localOpen, setOpen };
}

/** Exported for the tests of the item. */
export interface ConfirmationDialogViewProps
  extends Omit<ConfirmationDialogProps, 'open' | 'defaultOpen' | 'onOpenChange' | 'onConfirm'> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onConfirm: () => void;
}

/** Exported for the tests of the item. */
export function ConfirmationDialogView({
  trigger,
  title,
  description,
  labelConfirmButton,
  labelCancelButton,
  children,
  open,
  onOpenChange,
  pending,
  onConfirm,
}: ConfirmationDialogViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className='md:text-left'>{description}</DialogDescription>
        </DialogHeader>
        {children}
        <DialogFooter>
          {labelCancelButton && (
            <DialogClose asChild>
              <Button variant='outline'>{labelCancelButton}</Button>
            </DialogClose>
          )}
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

export function ConfirmationDialog({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onConfirm,
  ...props
}: ConfirmationDialogProps) {
  const [localOpen, setLocalOpen] = React.useState(defaultOpen);
  const [pending, setPending] = React.useState(false);
  const { open, setOpen } = resolveOpenState({ open: controlledOpen, localOpen, setLocalOpen, onOpenChange });

  return (
    <ConfirmationDialogView
      {...props}
      open={open}
      onOpenChange={setOpen}
      pending={pending}
      onConfirm={() => runConfirmation({ pending, onConfirm, setPending, close: () => setOpen(false) })}
    />
  );
}
