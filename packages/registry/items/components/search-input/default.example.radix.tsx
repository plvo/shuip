'use client';

import { useState } from 'react';
import { SearchInput } from '@/components/ui/shuip/search-input';

export default function SearchInputExample() {
  const [query, setQuery] = useState('');
  return (
    <div className='flex w-full max-w-sm flex-col gap-2'>
      <SearchInput value={query} onChange={setQuery} placeholder='Search…' />
      {query && <p className='text-sm text-muted-foreground'>Query: {query}</p>}
    </div>
  );
}
