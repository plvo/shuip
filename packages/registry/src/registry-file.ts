import type { Variant } from './style-base';

/** The Radix registry is the canonical `registry.json`; every other variant gets its own suffixed file. */
export const registryFilename = (variant: Variant): string =>
  variant === 'radix' ? 'registry.json' : `registry.${variant}.json`;
