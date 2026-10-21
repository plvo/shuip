import { afterAll, beforeAll } from 'bun:test';

/**
 * Runs the tests of the enclosing `describe` or file in `zone`, then puts the zone of the host back. Bun applies a
 * change of `process.env.TZ` to the dates built after it, so the dates of those tests are built inside the tests.
 */
export function useTimeZone(zone: string): void {
  const hostZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  beforeAll(() => {
    process.env.TZ = zone;
  });
  afterAll(() => {
    process.env.TZ = hostZone;
  });
}
