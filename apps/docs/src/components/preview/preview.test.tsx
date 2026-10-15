import { describe, expect, test } from 'bun:test';
import { BaseUiProviders } from '../providers/base-ui-providers';
import { providersFor } from '../providers/providers-for-base';
import { RadixProviders } from '../providers/radix-providers';
import { BaseUiPreview } from './base-ui-preview';
import { previewFor } from './preview';
import { RadixPreview } from './radix-preview';

describe('previewFor', () => {
  test('previews Base UI pages with the Base UI previews', () => {
    expect(previewFor('base')).toBe(BaseUiPreview);
  });

  test('previews Radix pages with the Radix previews', () => {
    expect(previewFor('radix')).toBe(RadixPreview);
  });
});

describe('providersFor', () => {
  test('mounts the Base UI providers on Base UI pages and the Radix ones on Radix pages', () => {
    expect(providersFor('base')).toBe(BaseUiProviders);
    expect(providersFor('radix')).toBe(RadixProviders);
  });
});
