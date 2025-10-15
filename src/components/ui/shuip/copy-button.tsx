'use client';

import type { VariantProps } from 'class-variance-authority';
import { CheckIcon, Copy } from 'lucide-react';
import * as React from 'react';
import { Button, type buttonVariants } from '@/components/ui/button';

const DEFAULT_TIMEOUT = 2000;

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export interface CopyButtonProps extends ButtonProps {
  value: string;
  copiedIcon?: React.ReactNode;
  notCopiedIcon?: React.ReactNode;
}

export function CopyButton({ value, copiedIcon = <CheckIcon />, notCopiedIcon = <Copy />, ...props }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setHasCopied(true);
    setTimeout(() => {
      setHasCopied(false);
    }, DEFAULT_TIMEOUT);
  };

  return (
    <Button size='icon' variant={'ghost'} className={'z-10 size-4'} onClick={handleCopy} {...props}>
      <span className='sr-only'>Copy</span>
      {hasCopied ? copiedIcon : notCopiedIcon}
    </Button>
  );
}
