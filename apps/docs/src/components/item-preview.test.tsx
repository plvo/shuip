import { describe, expect, test } from 'bun:test';
import type { ReactElement } from 'react';
import { previewGroupId } from '@/lib/tab-groups';
import { ItemPreview } from './item-preview';

const tabsOf = (exampleKey: string) =>
  (ItemPreview({ exampleKey, source: 'const a = 1;', children: 'preview' }) as ReactElement<Record<string, unknown>>)
    .props;

describe('ItemPreview', () => {
  test('keeps the tab of each example in the group of that example', () => {
    const props = tabsOf('side-dialog.sizes.example');

    expect(props.groupId).toBe(previewGroupId('side-dialog.sizes.example'));
    expect(props.groupId).not.toBe(tabsOf('side-dialog.example').groupId);
  });

  test('remembers the tab beyond the session', () => {
    expect(tabsOf('side-dialog.example').persist).toBe(true);
  });

  test('shows the preview in the first tab and the source in the second', () => {
    const [preview, source] = tabsOf('side-dialog.example').children as ReactElement<{ children: unknown }>[];

    expect(preview?.props.children).toBe('preview');
    expect(source?.props.children).toBe('const a = 1;');
  });
});
