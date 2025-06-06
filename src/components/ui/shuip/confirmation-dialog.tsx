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
import type * as React from 'react';

export interface ConfirmationDialogProps extends React.RefAttributes<HTMLDialogElement> {
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
          <Button onClick={onConfirm}>{labelConfirmButton}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
