import { describe, expect, test } from 'bun:test';
import { switchBaseUrl } from './base-routes';
import { sectionPageUrls } from './section-sources';
import { sidebarSources } from './source';

describe('switching base on the pages of the docs', () => {
  test('lands on the same item of the components in the other base', () => {
    const pages = sectionPageUrls('components', sidebarSources);

    expect(switchBaseUrl('/components/base/side-dialog', 'radix', pages)).toBe('/components/radix/side-dialog');
    expect(switchBaseUrl('/components/radix/side-dialog', 'base', pages)).toBe('/components/base/side-dialog');
  });

  test('lands on the same block in the other base', () => {
    const pages = sectionPageUrls('blocks', sidebarSources);

    expect(switchBaseUrl('/blocks/base/kanban', 'radix', pages)).toBe('/blocks/radix/kanban');
  });

  test('lands on the index of the section for a page that does not exist', () => {
    const pages = sectionPageUrls('components', sidebarSources);

    expect(switchBaseUrl('/components/base/no-such-item', 'radix', pages)).toBe('/components/radix');
  });
});
