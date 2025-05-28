import { Button } from '@/components/ui/button';
import { ReloadIcon } from '@radix-ui/react-icons';
import type * as React from 'react';

export interface SubmitButtonProps extends React.RefAttributes<HTMLButtonElement> {
  label?: React.JSX.Element | string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.JSX.Element;
}

export function SubmitButton({
  onClick,
  label,
  disabled,
  loading,
  icon = <ReloadIcon className='mr-2 size-4 animate-spin' />,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      type='submit'
      variant={'default'}
      className={'w-full'}
      disabled={disabled || loading}
      {...props}
      {...(onClick && { onClick })}
    >
      {loading && icon}
      {label}
    </Button>
  );
}
