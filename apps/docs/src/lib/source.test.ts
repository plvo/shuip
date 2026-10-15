import { describe, expect, test } from 'bun:test';
import { switchBaseUrl } from './base-routes';
import { sectionPageUrls } from './section-sources';
import { docsSource, pageSlugFromImageSegments, sectionSources } from './source';

describe('switching base on the pages of the docs', () => {
  test('lands on the same item of the components in the other base', () => {
    const pages = sectionPageUrls('components', sectionSources);

    expect(switchBaseUrl('/components/base/side-dialog', 'radix', pages)).toBe('/components/radix/side-dialog');
    expect(switchBaseUrl('/components/radix/side-dialog', 'base', pages)).toBe('/components/base/side-dialog');
  });

  test('lands on the same block in the other base', () => {
    const pages = sectionPageUrls('blocks', sectionSources);

    expect(switchBaseUrl('/blocks/base/kanban', 'radix', pages)).toBe('/blocks/radix/kanban');
  });

  test('lands on the index of the section for a page that does not exist', () => {
    const pages = sectionPageUrls('components', sectionSources);

    expect(switchBaseUrl('/components/base/no-such-item', 'radix', pages)).toBe('/components/radix');
  });
});

describe('og image slugs', () => {
  test('drops the trailing image.png before the page lookup', () => {
    expect(pageSlugFromImageSegments(['configuration', 'image.png'])).toEqual(['configuration']);
    expect(pageSlugFromImageSegments(['blocks', 'kanban', 'image.png'])).toEqual(['blocks', 'kanban']);
    expect(pageSlugFromImageSegments(['configuration'])).toEqual(['configuration']);
  });

  test('fails the page lookup when the slug still carries image.png', () => {
    // The og routes are served at `.../<slug>/image.png`; the lookup must drop
    // that segment or every og image 404s (the bug from issue #117).
    expect(docsSource.getPage(['configuration', 'image.png'])).toBeUndefined();
    expect(docsSource.getPage(pageSlugFromImageSegments(['configuration', 'image.png']))).toBeDefined();
  });
});
