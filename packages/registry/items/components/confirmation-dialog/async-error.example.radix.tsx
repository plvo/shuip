'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/shuip/confirmation-dialog';

const saveChanges = () =>
  new Promise<void>((_, reject) => setTimeout(() => reject(new Error('The server is unreachable.')), 1500));

export default function ConfirmationDialogAsyncErrorExample() {
  const [error, setError] = useState<string>();

  return (
    <ConfirmationDialog
      trigger={<Button>Save changes</Button>}
      title='Save changes'
      description={error ?? 'Are you sure you want to save these changes?'}
      labelConfirmButton='Save'
      labelCancelButton='Cancel'
      onConfirm={async () => {
        setError(undefined);
        try {
          await saveChanges();
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Something went wrong.');
          throw e;
        }
      }}
    />
  );
}
