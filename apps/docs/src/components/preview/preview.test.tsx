import { describe, expect, test } from 'bun:test';
import type { ReactElement } from 'react';
import { BaseUiProviders } from '../providers/base-ui-providers';
import { providersFor } from '../providers/providers-for-base';
import { RadixProviders } from '../providers/radix-providers';
import { BaseUiPreview } from './base-ui-preview';
import { Preview, previewFor } from './preview';
import { PreviewCard } from './preview-card';
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

describe('Preview', () => {
  const cardOf = (props: Parameters<typeof Preview>[0]) => Preview(props) as ReactElement<Record<string, unknown>>;

  test('wraps the preview in a card that opens the full page of its example, under the base of the page', () => {
    const card = cardOf({ base: 'radix', registryName: 'copy-button.with-custom-icons.example' });

    expect(card.type).toBe(PreviewCard);
    expect(card.props.href).toBe('/preview/radix/copy-button/with-custom-icons');
    expect(card.props.label).toBe('Open Copy Button With Custom Icons full page');
  });

  test('tells the card which of the cards of its page it is', () => {
    expect(cardOf({ base: 'base', registryName: 'copy-button.example', slot: 'header' }).props.slot).toBe('header');
    expect(cardOf({ base: 'base', registryName: 'copy-button.example' }).props.slot).toBe('page');
  });

  test('previews the example with the previews of the base of the page', () => {
    const card = cardOf({ base: 'base', registryName: 'copy-button.example' });

    expect((card.props.children as ReactElement).type).toBe(BaseUiPreview);
  });

  test('is the bare preview, without a card or a button, for a thumbnail', () => {
    const bare = cardOf({ base: 'radix', registryName: 'copy-button.example', expandable: false });

    expect(bare.type).toBe(RadixPreview);
    expect(bare.props.href).toBeUndefined();
  });
});
