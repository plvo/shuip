'use client';

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InlineEdit } from '@/components/ui/shuip/inline-edit';

const STATUSES = ['Active', 'Paused', 'Archived'];

export default function InlineEditChildrenExample() {
  const [status, setStatus] = React.useState('Active');

  const handleSave = async (next: string) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    setStatus(next);
  };

  return (
    <div className='w-full max-w-sm'>
      <InlineEdit value={status} onSave={handleSave}>
        {({ value, commit, className }) => (
          <Select defaultOpen value={value} onValueChange={(next) => commit(next)}>
            <SelectTrigger className={className}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </InlineEdit>
    </div>
  );
}
