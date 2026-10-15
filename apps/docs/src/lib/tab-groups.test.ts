import { describe, expect, test } from 'bun:test';
import { TAB_GROUPS } from './tab-groups';

describe('TAB_GROUPS', () => {
  const ids = Object.values(TAB_GROUPS);

  test('gives every group of tabs its own id, so a choice never reaches the tabs of another group', () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('namespaces the ids, which are the storage keys shared with everything else served from the same origin', () => {
    for (const id of ids) expect(id).toStartWith('shuip-');
  });
});
