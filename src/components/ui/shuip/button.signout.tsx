'use client';

// import { signOut } from "next-auth/react";
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { DialogConfirmation } from './dialog.confirmation';

export default function ButtonLogout({ withLogo, onConfirm }: { withLogo?: boolean; onConfirm?: () => void }) {
  return (
    <DialogConfirmation
      trigger={
        <Button variant='outline' className='text-destructive' size={withLogo ? 'icon' : 'default'}>
          {withLogo ? <LogOut /> : 'Sign out'}
        </Button>
      }
      title='Sign out'
      description='Are you sure you want to sign out?'
      labelConfirmButton='Sign out'
      onConfirm={() => onConfirm}
      //   onConfirm={() => signOut()}
    />
  );
}
