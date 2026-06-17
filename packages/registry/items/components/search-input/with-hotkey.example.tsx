'use client';

import { useState } from 'react';
import { SearchInput } from '@/components/ui/shuip/search-input';

export default function SearchInputWithHotkeyExample() {
  const [query, setQuery] = useState('');
  return (
    <SearchInput
      value={query}
      onChange={setQuery}
      hotkey='k'
      hotkeyTooltip='Press K to search'
      placeholder='Search…'
      className='w-full max-w-sm'
    />
  );
}
