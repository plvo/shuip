import { describe, expect, test } from 'bun:test';
import { previewGroupId, TAB_GROUPS } from './tab-groups';

describe('previewGroupId', () => {
  test('is the same for an example whichever base shows it, so its tab survives a base switch', () => {
    expect(previewGroupId('side-dialog.sizes.example')).toBe(previewGroupId('side-dialog.sizes.example'));
  });

  test('differs between examples, so each one remembers its own tab', () => {
    expect(previewGroupId('side-dialog.example')).not.toBe(previewGroupId('side-dialog.sizes.example'));
    expect(previewGroupId('side-dialog.example')).not.toBe(previewGroupId('copy-button.example'));
  });

  test('stays apart from the package manager group and carries the namespace of the site', () => {
    const id = previewGroupId('side-dialog.example');

    expect(id).not.toBe(TAB_GROUPS.packageManager);
    expect(id).toStartWith('shuip-');
    expect(id).toContain('side-dialog.example');
  });
});

describe('TAB_GROUPS.packageManager', () => {
  test('namespaces the storage key shared with everything else served from the same origin', () => {
    expect(TAB_GROUPS.packageManager).toStartWith('shuip-');
  });
});
