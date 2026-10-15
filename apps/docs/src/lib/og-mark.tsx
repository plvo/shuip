/** biome-ignore-all lint/performance/noImgElement: false positive */

import { SHUIP_MARK } from '@/lib/shuip-mark';

/**
 * The shuip mark as an inline SVG for next/og cards: the same two arcs the
 * site's navigation uses, tinted with the card's primary text colour.
 */
export const ogMark = (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox={SHUIP_MARK.viewBox}
    width={56}
    height={56}
    fill='none'
    stroke='currentColor'
    strokeWidth={SHUIP_MARK.strokeWidth}
    strokeLinecap={SHUIP_MARK.strokeLinecap}
    aria-hidden='true'
  >
    {SHUIP_MARK.arcs.map(({ d, ...arc }) => (
      <path key={d} d={d} {...arc} />
    ))}
  </svg>
);
