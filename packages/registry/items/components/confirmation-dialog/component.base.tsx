import type * as React from 'react';
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
  onConfirm?: () => void;
}

export function ConfirmationDialog({
  trigger,
  nativeButton,
  title,
  description,
  labelConfirmButton,
  onConfirm,
  ...props
}: ConfirmationDialogProps) {
  return (
    <Dialog {...props}>
      {trigger && <DialogTrigger render={trigger} nativeButton={nativeButton} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className='md:text-left'>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button />} onClick={onConfirm}>
            {labelConfirmButton}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
