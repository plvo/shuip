import type { FormAsyncValidateOrFn, FormValidateOrFn, ReactFormApi } from '@tanstack/react-form';
import type { VariantProps } from 'class-variance-authority';
import { Loader2Icon } from 'lucide-react';
import { Button, type buttonVariants } from '@/components/ui/button';

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export interface SubmitButtonProps<TFormData> {
  form: ReactFormApi<
    TFormData,
    undefined | FormValidateOrFn<TFormData>,
    undefined | FormValidateOrFn<TFormData>,
    undefined | FormAsyncValidateOrFn<TFormData>,
    undefined | FormValidateOrFn<TFormData>,
    undefined | FormAsyncValidateOrFn<TFormData>,
    undefined | FormValidateOrFn<TFormData>,
    undefined | FormAsyncValidateOrFn<TFormData>,
    undefined | FormValidateOrFn<TFormData>,
    undefined | FormAsyncValidateOrFn<TFormData>,
    undefined | FormAsyncValidateOrFn<TFormData>,
    any
  >;
  children?: React.ReactNode;
  props?: ButtonProps;
}

export function SubmitButton<TFormData>({ form, children = 'Submit', props }: SubmitButtonProps<TFormData>) {
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
