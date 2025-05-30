'use client';

import { CopyButton } from '@/components/ui/shuip/copy-button';
import { Cat, Dog } from 'lucide-react';

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
