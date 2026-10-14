import type React from 'react';
import type { Base } from '@/lib/base-routes';
import { BaseUiProviders } from './providers-base-ui';
import { RadixProviders } from './providers-radix';

const PROVIDERS = { base: BaseUiProviders, radix: RadixProviders } satisfies Record<Base, unknown>;

/** Mounts the providers of one primitive library for a page, so the two libraries never share a tree. */
export function BaseProviders({ base, children }: { base: Base; children: React.ReactNode }) {
  const Providers = PROVIDERS[base];
  return <Providers>{children}</Providers>;
}
