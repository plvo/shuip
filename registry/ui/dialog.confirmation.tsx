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
import type { JSX } from 'react';

export interface DialogConfirmationProps {
  trigger: JSX.Element;
  title: string;
  description: string;
  labelConfirmButton: string;
  onConfirm: () => void;
}

export function DialogConfirmation({
  trigger,
  title,
  description,
  labelConfirmButton,
  onConfirm,
}: DialogConfirmationProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="md:text-left">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onConfirm}>{labelConfirmButton}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
