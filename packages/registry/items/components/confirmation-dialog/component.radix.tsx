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
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  labelConfirmButton?: string;
  onConfirm?: () => void;
}

export function ConfirmationDialog({
  trigger,
  title,
  description,
  labelConfirmButton,
  onConfirm,
  ...props
}: ConfirmationDialogProps) {
  return (
    <Dialog {...props}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className='md:text-left'>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button onClick={onConfirm}>{labelConfirmButton}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
