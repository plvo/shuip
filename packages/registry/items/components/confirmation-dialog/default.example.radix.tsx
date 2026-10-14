import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/shuip/confirmation-dialog';

export default function ConfirmationDialogExample() {
  return (
    <ConfirmationDialog
      trigger={<Button>Open confirmation dialog</Button>}
      title='Confirmation Dialog'
      description='Are you sure you want to make this action?'
      labelConfirmButton='Make it'
      onConfirm={() => alert('Confirmed')}
    />
  );
}
