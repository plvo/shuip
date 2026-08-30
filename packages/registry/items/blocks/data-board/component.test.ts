import { describe, expect, test } from 'bun:test';
import { buildGroups, groupIdOf, limitFor, paginate, UNGROUPED_ID, visibleColumns } from './component';

type Task = { id: string; status: string; sprint?: number | null; team?: string };

const task = (id: string, sprint?: number | null, team?: string): Task => ({ id, status: 'todo', sprint, team });

describe('groupIdOf', () => {
  test('maps null and undefined to the ungrouped bucket', () => {
    expect(groupIdOf(null)).toBe(UNGROUPED_ID);
    expect(groupIdOf(undefined)).toBe(UNGROUPED_ID);
  });

  test('stringifies any other value', () => {
    expect(groupIdOf(3)).toBe('3');
    expect(groupIdOf('alpha')).toBe('alpha');
    expect(groupIdOf(0)).toBe('0');
    expect(groupIdOf(false)).toBe('false');
  });
});

describe('buildGroups', () => {
  test('derives bands from the values present', () => {
    const bands = buildGroups([task('a', 1), task('b', 2), task('c', 1)], { field: 'sprint' }, 'Ungrouped');
    expect(bands.map((b) => b.id)).toEqual(['1', '2']);
    expect(bands[0].items.map((i) => i.id)).toEqual(['a', 'c']);
  });

  test('sorts numerically when every value is numeric', () => {
    const bands = buildGroups([task('a', 10), task('b', 2), task('c', 1)], { field: 'sprint' }, 'Ungrouped');
    expect(bands.map((b) => b.id)).toEqual(['1', '2', '10']);
  });

  test('sorts alphabetically when values are not numeric', () => {
    const items = [task('a', null, 'ops'), task('b', null, 'crm'), task('c', null, 'finance')];
    const bands = buildGroups(items, { field: 'team' }, 'Ungrouped');
    expect(bands.map((b) => b.id)).toEqual(['crm', 'finance', 'ops']);
  });

  test('puts null and undefined values last, under the ungrouped label', () => {
    const bands = buildGroups([task('a', null), task('b', 2), task('c')], { field: 'sprint' }, 'No sprint');
    expect(bands.map((b) => b.id)).toEqual(['2', UNGROUPED_ID]);
    expect(bands[1].label).toBe('No sprint');
    expect(bands[1].items.map((i) => i.id)).toEqual(['a', 'c']);
  });

  test('preserves the item value on the band, not the stringified id', () => {
    const bands = buildGroups([task('a', 7)], { field: 'sprint' }, 'Ungrouped');
    expect(bands[0].value).toBe(7);
  });

  test('an explicit groups array imposes order and keeps empty groups', () => {
    const bands = buildGroups(
      [task('a', 2)],
      {
        field: 'sprint',
        groups: [
          { id: '2', label: 'Sprint 2' },
          { id: '1', label: 'Sprint 1' },
        ],
      },
      'Ungrouped',
    );
    expect(bands.map((b) => b.id)).toEqual(['2', '1']);
    expect(bands.map((b) => b.label)).toEqual(['Sprint 2', 'Sprint 1']);
    expect(bands[1].items).toEqual([]);
  });

  test('values absent from an explicit groups array are appended after it', () => {
    const bands = buildGroups(
      [task('a', 9), task('b', 1)],
      {
        field: 'sprint',
        groups: [{ id: '1', label: 'Sprint 1' }],
      },
      'Ungrouped',
    );
    expect(bands.map((b) => b.id)).toEqual(['1', '9']);
  });

  test('the label callback renders the band label from the raw value', () => {
    const bands = buildGroups(
      [task('a', 4)],
      {
        field: 'sprint',
        label: (value) => `Sprint ${String(value)}`,
      },
      'Ungrouped',
    );
    expect(bands[0].label).toBe('Sprint 4');
  });
});

describe('paginate', () => {
  const items = [1, 2, 3, 4, 5];

  test('reports the hidden remainder', () => {
    expect(paginate(items, 2)).toEqual({ shown: [1, 2], hidden: 3 });
  });

  test('hides nothing when the limit reaches the length', () => {
    expect(paginate(items, 5)).toEqual({ shown: items, hidden: 0 });
    expect(paginate(items, 99)).toEqual({ shown: items, hidden: 0 });
  });

  test('hides nothing when the limit is infinite', () => {
    expect(paginate(items, Number.POSITIVE_INFINITY)).toEqual({ shown: items, hidden: 0 });
  });
});

describe('limitFor', () => {
  test('grows by one page size per revealed step', () => {
    expect(limitFor(20, 0)).toBe(20);
    expect(limitFor(20, 2)).toBe(60);
  });

  test('is infinite when pagination is disabled', () => {
    expect(limitFor(false, 0)).toBe(Number.POSITIVE_INFINITY);
    expect(limitFor(0, 3)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe('visibleColumns', () => {
  const columns = [
    { id: 'a', label: 'A' },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C' },
  ];

  test('returns the same array reference when nothing is hidden', () => {
    expect(visibleColumns(columns, [])).toBe(columns);
  });

  test('preserves the original order after unhiding', () => {
    expect(visibleColumns(columns, ['b']).map((c) => c.id)).toEqual(['a', 'c']);
    expect(visibleColumns(columns, []).map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });
});
