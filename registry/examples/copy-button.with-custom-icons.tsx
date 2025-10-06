'use client';

import { Cat, Dog } from 'lucide-react';
import { CopyButton } from '@/components/ui/shuip/copy-button';

export default function CopyButtonWithCustomIconsExample() {
  return (
    <CopyButton
      value='Hello, cat!'
      copiedIcon={<Dog className='size-6' />}
      notCopiedIcon={<Cat className='size-6' />}
      className='size-8'
      variant={'default'}
    />
  );
}
