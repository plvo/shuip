import { describe, expect, test } from 'bun:test';
import { DEFAULT_BASE, switchBaseUrl } from './base-routes';
import { sectionPageUrls } from './section-sources';
import {
  blocksSources,
  componentsSources,
  docsSource,
  getPageImage,
  OG_IMAGE_FILE,
  pageForOgImage,
  pageSlugFromImageSegments,
  sectionSources,
} from './source';

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
    expect(pageSlugFromImageSegments(['configuration', OG_IMAGE_FILE])).toEqual(['configuration']);
    expect(pageSlugFromImageSegments(['blocks', 'kanban', OG_IMAGE_FILE])).toEqual(['blocks', 'kanban']);
    expect(pageSlugFromImageSegments(['configuration'])).toEqual(['configuration']);
  });

  test('maps the index page of a section to empty slugs', () => {
    expect(pageSlugFromImageSegments([OG_IMAGE_FILE])).toEqual([]);
    expect(pageSlugFromImageSegments(['blocks', OG_IMAGE_FILE])).toEqual(['blocks']);
  });

  test('fails the page lookup when the slug still carries image.png', () => {
    // The og routes are served at `.../<slug>/image.png`; the lookup must drop
    // that segment or every og image 404s (the bug from issue #117).
    expect(docsSource.getPage(['configuration', OG_IMAGE_FILE])).toBeUndefined();
    expect(docsSource.getPage(pageSlugFromImageSegments(['configuration', OG_IMAGE_FILE]))).toBeDefined();
  });
});

describe('og image routes', () => {
  const sections: [label: string, source: Parameters<typeof pageForOgImage>[0], section: string][] = [
    ['docs', docsSource, 'docs'],
    ['components', componentsSources[DEFAULT_BASE], 'components'],
    ['blocks', blocksSources[DEFAULT_BASE], 'blocks'],
  ];

  test.each(sections)('%s: every prerendered page resolves through the route handler', (_label, source, section) => {
    const pages = source.getPages();
    expect(pages.length).toBeGreaterThan(0);

    for (const page of pages) {
      const { segments } = getPageImage(page, section);
      // generateStaticParams prerenders these segments; the GET handler must
      // resolve them back to the same page. An index page (empty slugs)
      // prerenders as `image.png`, which maps back to `[]`.
      expect(pageForOgImage(source, segments), `${section}/${segments.join('/')}`).toBeDefined();
    }
  });
});
