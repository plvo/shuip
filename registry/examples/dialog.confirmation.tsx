import { Button } from '@/components/ui/button';
import { DialogConfirmation } from '@/components/ui/shuip/dialog.confirmation';

export function DialogConfirmationExample() {
  return (
    <DialogConfirmation
      trigger={<Button>Open confirmation dialog</Button>}
      title="Confirmation Dialog"
      description="Are you sure you want to make this action?"
      labelConfirmButton="Make it"
      onConfirm={() => alert('Confirmed')}
    />
  );
}
