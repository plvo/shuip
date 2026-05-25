'use client';

import * as React from 'react';
import { InlineEdit } from '@/components/ui/shuip/inline-edit';

export default function InlineEditExample() {
  const [name, setName] = React.useState('Acme Corporation');

  const handleSave = async (next: string) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setName(next);
  };

  return (
    <div className='w-full max-w-sm'>
      <InlineEdit value={name} onSave={handleSave} placeholder='Add a name' />
    </div>
  );
}
