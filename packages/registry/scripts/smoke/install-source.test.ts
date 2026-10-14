import { describe, expect, test } from 'bun:test';
import { assertEveryItemServedLocally } from './install-source';
import { StepFailure } from './step';

describe('assertEveryItemServedLocally', () => {
  const served = new Set(['/r/radix-vega/button-a.json', '/r/radix-vega/button-b.json']);

  test('passes when every item was served under the consumer style path', () => {
    expect(() => assertEveryItemServedLocally(served, 'radix-vega', ['button-a', 'button-b'])).not.toThrow();
  });

  test('names the items that were never requested', () => {
    let failure: unknown;
    try {
      assertEveryItemServedLocally(served, 'radix-vega', ['button-a', 'button-c']);
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(StepFailure);
    expect((failure as StepFailure).output).toContain('button-c');
    expect((failure as StepFailure).output).not.toContain('button-a');
  });

  test('does not accept a request made under another style path', () => {
    expect(() => assertEveryItemServedLocally(served, 'base-vega', ['button-a'])).toThrow(StepFailure);
  });
});
