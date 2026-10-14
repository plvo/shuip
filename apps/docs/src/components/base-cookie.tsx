'use client';

import { useEffect } from 'react';
import { type Base, writeBaseCookie } from '@/lib/base-routes';

/**
 * Remembers the base of the page in a cookie, for the redirects of addresses that have no base. It is written in the
 * browser because reading a cookie on the server would make every page dynamic.
 */
export function BaseCookie({ base }: { base: Base }) {
  useEffect(() => {
    writeBaseCookie(base, document);
  }, [base]);

  return null;
}
