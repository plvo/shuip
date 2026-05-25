'use client';

import * as React from 'react';
import { InlineEdit } from '@/components/ui/shuip/inline-edit';

export default function InlineEditBoxedExample() {
  const [description, setDescription] = React.useState('Family-owned manufacturer since 1998.');

  const handleSave = async (next: string) => {
    await new Promise((resolve) => setTimeout(resolve, 600));
    setDescription(next);
  };

  return (
    <div className='w-full max-w-sm'>
      <InlineEdit
        value={description}
        onSave={handleSave}
        input='textarea'
        variant='boxed'
        placeholder='Add a description'
      />
    </div>
  );
}
