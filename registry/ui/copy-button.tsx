'use client';

import { Button, type buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import { CheckIcon, Copy } from 'lucide-react';
import * as React from 'react';

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export interface CopyButtonProps extends ButtonProps {
  value: string;
  copiedIcon?: React.ReactNode;
  notCopiedIcon?: React.ReactNode;
}

async function copyToClipboardWithMeta(value: string) {
  navigator.clipboard.writeText(value);
}

export function CopyButton({ value, copiedIcon = <CheckIcon />, notCopiedIcon = <Copy />, ...props }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  }, [hasCopied]);

  return (
    <Button
      size='icon'
      variant={'ghost'}
      className={'z-10 size-4'}
      onClick={() => {
        copyToClipboardWithMeta(value);
        setHasCopied(true);
      }}
      {...props}
    >
      <span className='sr-only'>Copy</span>
      {hasCopied ? copiedIcon : notCopiedIcon}
    </Button>
  );
}
