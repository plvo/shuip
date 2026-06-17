'use client';

import { useState } from 'react';
import { SearchInput } from '@/components/ui/shuip/search-input';

export default function SearchInputNoHotkeyExample() {
  const [query, setQuery] = useState('');
  return (
    <SearchInput
      value={query}
      onChange={setQuery}
      hotkey={false}
      placeholder='Filter items…'
      className='w-full max-w-sm'
    />
  );
}
