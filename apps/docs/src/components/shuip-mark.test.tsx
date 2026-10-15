import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { SHUIP_MARK } from '@/lib/shuip-mark';
import { ShuipMark } from './shuip-mark';

describe('ShuipMark', () => {
  const markup = renderToStaticMarkup(<ShuipMark />);

  test('is hidden from assistive technology, the surrounding link names it', () => {
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain('<title');
  });

  test('draws the geometry of the mark', () => {
    expect(markup).toContain(`viewBox="${SHUIP_MARK.viewBox}"`);
    expect(markup.match(/<path /g)).toHaveLength(SHUIP_MARK.arcs.length);
    expect(markup.match(new RegExp(`stroke-width="${SHUIP_MARK.strokeWidth}"`, 'g'))).toHaveLength(
      SHUIP_MARK.arcs.length,
    );
    expect(markup.match(new RegExp(`stroke-linecap="${SHUIP_MARK.strokeLinecap}"`, 'g'))).toHaveLength(
      SHUIP_MARK.arcs.length,
    );
    for (const { d, opacity } of SHUIP_MARK.arcs) {
      expect(markup).toContain(`d="${d}"`);
      if (opacity !== undefined) expect(markup).toContain(`opacity="${opacity}"`);
    }
  });

  test('follows the text colour', () => {
    expect(markup).toContain('stroke="currentColor"');
  });

  test('takes a class name to size it', () => {
    expect(renderToStaticMarkup(<ShuipMark className='h-5' />)).toContain('class="h-5"');
  });
});
