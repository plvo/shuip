'use client';

import { Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFormContext } from '@/components/ui/shuip/tanstack-form/form-context';

export interface SubmitButtonProps {
  children?: React.ReactNode;
  props?: React.ComponentProps<typeof Button>;
}

export function SubmitButton({ children = 'Submit', props }: SubmitButtonProps) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => [state.isSubmitting, state.canSubmit]}>
      {([isSubmitting, canSubmit]) => (
        <Button type='submit' disabled={isSubmitting || !canSubmit} className='transition-all duration-300' {...props}>
          {isSubmitting && <Loader2Icon role='status' aria-label='Loading' className='size-4 animate-spin' />}
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}
