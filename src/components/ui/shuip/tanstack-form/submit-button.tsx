import type { VariantProps } from 'class-variance-authority';
import { Loader2Icon } from 'lucide-react';
import { Button, type buttonVariants } from '@/components/ui/button';
import { useFormContext } from '../hooks/tsf-context';

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export interface SubmitButtonProps extends ButtonProps {
  children?: React.ReactNode;
}

export function SubmitButton({ children = 'Submit', ...props }: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.isSubmitting, state.canSubmit]}>
      {([isSubmitting, canSubmit]) => (
        <Button type='submit' disabled={isSubmitting || !canSubmit} className='transition-all duration-300' {...props}>
          {isSubmitting && <Loader2Icon role='status' aria-label='Loading' className={'size-4 animate-spin'} />}
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}
