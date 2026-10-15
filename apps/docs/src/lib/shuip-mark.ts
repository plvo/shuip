export interface ShuipMarkArc {
  /** The path of the arc, on the 32-unit grid the mark is drawn on. */
  d: string;
  opacity?: number;
}

/**
 * The shuip mark: two arcs forming an "S", the second at reduced opacity.
 * `viewBox` is the glyph's bounds, stroke included, so the mark has no empty margin of its own.
 */
export const SHUIP_MARK = {
  viewBox: '8.75 3.75 14.5 24.5',
  strokeWidth: 4.5,
  strokeLinecap: 'round',
  arcs: [{ d: 'M21 11A5 5 0 1 0 16 16' }, { d: 'M16 16A5 5 0 1 1 11 21', opacity: 0.45 }],
} as const satisfies {
  viewBox: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  arcs: readonly ShuipMarkArc[];
};
