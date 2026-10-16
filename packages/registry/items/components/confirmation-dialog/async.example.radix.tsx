'use client';

import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/shuip/confirmation-dialog';

const deleteAccount = () => new Promise<void>((resolve) => setTimeout(resolve, 1500));

export default function ConfirmationDialogAsyncExample() {
  return (
    <ConfirmationDialog
      trigger={<Button variant='destructive'>Delete account</Button>}
      title='Delete account'
      description='This will permanently delete your account and all associated data.'
      labelConfirmButton='Delete account'
      labelCancelButton='Cancel'
      onConfirm={deleteAccount}
    />
  );
}
