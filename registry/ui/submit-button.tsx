import { ReloadIcon } from '@radix-ui/react-icons';
import type { VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { Button, type buttonVariants } from '@/components/ui/button';

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export interface SubmitButtonProps extends ButtonProps {
  children?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.JSX.Element;
}

export function SubmitButton({
  children,
  disabled,
  loading,
  icon = <ReloadIcon className='mr-2 size-4 animate-spin' aria-label='Loading' />,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type='submit' aria-label='Submit' className={'w-full'} disabled={disabled || loading} {...props}>
      {loading && icon}
      {children}
    </Button>
  );
}
