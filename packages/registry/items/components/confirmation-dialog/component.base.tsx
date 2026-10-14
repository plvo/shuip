import type * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface ConfirmationDialogProps extends React.RefAttributes<HTMLDialogElement> {
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
          <Button onClick={onConfirm}>{labelConfirmButton}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
