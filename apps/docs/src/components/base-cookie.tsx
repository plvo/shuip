'use client';

import { useEffect } from 'react';
import { type Base, baseCookie } from '@/lib/base-routes';

/**
 * Remembers the base of the page in a cookie, for the redirects of addresses that have no base. It is written in the
 * browser because reading a cookie on the server would make every page dynamic.
 */
export function BaseCookie({ base }: { base: Base }) {
  useEffect(() => {
    // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is not available in every supported browser
    document.cookie = baseCookie(base);
  }, [base]);

  return null;
}
