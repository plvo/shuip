'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { type BasedSection, baseOfPath, sectionUrl } from '@/lib/base-routes';

/** A link to the index of a section in the base of the page being viewed, which a not-found page cannot read from its params. */
export function SectionLink({ section, children }: { section: BasedSection; children: React.ReactNode }) {
  const base = baseOfPath(usePathname());
  return <Link href={sectionUrl(section, base)}>{children}</Link>;
}
