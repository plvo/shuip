import type { ReactFormApi } from '@tanstack/react-form';
import type { VariantProps } from 'class-variance-authority';
import { Loader2Icon } from 'lucide-react';
import { Button, type buttonVariants } from '@/components/ui/button';

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export interface SubmitButtonProps extends Omit<ButtonProps, 'form'> {
  form: ReactFormApi<any, any, any, any, any, any, any, any, any, any, any, any>;
  children?: React.ReactNode;
}

export function SubmitButton({ form, children = 'Submit', ...props }: SubmitButtonProps) {
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
