import type React from 'react';
import type { Base } from '@/lib/base-routes';
import { BaseUiProviders } from './base-ui-providers';
import { RadixProviders } from './radix-providers';

const PROVIDERS = { base: BaseUiProviders, radix: RadixProviders } satisfies Record<Base, unknown>;

export const providersFor = (base: Base) => PROVIDERS[base];

/** Mounts the providers of one primitive library for a page, so the two libraries never share a tree. */
export function ProvidersForBase({ base, children }: { base: Base; children: React.ReactNode }) {
  const Providers = providersFor(base);
  return <Providers>{children}</Providers>;
}
