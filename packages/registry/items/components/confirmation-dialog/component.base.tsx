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

export function runConfirmation({ pending, onConfirm, setPending, close }: ConfirmationRun): void {
  if (pending) return;
  const result = onConfirm?.();
  if (!isPromiseLike(result)) {
    close();
    return;
  }
  setPending(true);
  void Promise.resolve(result)
    .then(close, () => {})
    .finally(() => setPending(false));
}

type DialogActionsRef = NonNullable<React.ComponentProps<typeof Dialog>['actionsRef']>;

export interface ConfirmationDialogViewProps extends Omit<ConfirmationDialogProps, 'onConfirm'> {
  actionsRef: DialogActionsRef;
  pending: boolean;
  onConfirm: () => void;
}

export function ConfirmationDialogView({
  trigger,
  nativeButton,
  title,
  description,
  labelConfirmButton,
  labelCancelButton,
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
        <DialogFooter>
          {labelCancelButton && <DialogClose render={<Button variant='outline' />}>{labelCancelButton}</DialogClose>}
          <Button onClick={onConfirm} disabled={pending} aria-busy={pending}>
            {pending && <Loader2Icon data-icon='inline-start' className='animate-spin' aria-hidden />}
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
