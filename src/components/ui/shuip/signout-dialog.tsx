import { LogOut } from 'lucide-react';
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

export interface SignoutDialogProps extends React.RefAttributes<HTMLDialogElement> {
  title?: string;
  description?: string;
  labelConfirmation?: string;
  withLogo?: boolean;
  trigger?: React.JSX.Element;
  onConfirm?: () => void;
}

export function SignoutDialog({
  title = 'Sign out',
  description = 'Are you sure you want to sign out?',
  labelConfirmation = 'Sign out',
  withLogo = false,
  trigger = <SignoutButton withLogo={withLogo} />,
  onConfirm,
  ...props
}: SignoutDialogProps) {
  return (
    <Dialog {...props}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className='md:text-left'>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onConfirm}>{labelConfirmation}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SignoutButton({ withLogo }: { withLogo?: boolean }) {
  return (
    <Button variant='outline' className='text-destructive' size={withLogo ? 'icon' : 'default'}>
      {withLogo ? <LogOut /> : 'Sign out'}
    </Button>
  );
}
