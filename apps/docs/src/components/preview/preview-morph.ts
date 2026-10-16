/** Names one preview card of a page. A page can show the same example twice, so the example alone does not. */
export const originOf = (slot: string, registryName: string): string => `${slot}:${registryName}`;

/** The view-transition class of the morph between a card and its full page, which the stylesheet gives its timing. */
export const MORPH_CLASS = 'preview-morph';

/** The view-transition name an example carries on its docs card and on its full page, which makes the two one element. */
export const transitionNameOf = (registryName: string): string => `preview-${registryName.replaceAll('.', '--')}`;

/** Only the card the reader opened carries the name: two elements of one name break the transition. */
export const cardTransitionName = (origin: string | null, slot: string, registryName: string): string | undefined =>
  origin === originOf(slot, registryName) ? transitionNameOf(registryName) : undefined;

/** The scroll position a card brings back: the card the reader opened takes it, every other card leaves it alone. */
export const scrollToRestoreFor = (
  origin: string | null,
  slot: string,
  registryName: string,
  takeScroll: () => number | null,
): number | null => (origin === originOf(slot, registryName) ? takeScroll() : null);

/** Escape closes the view unless something inside it, such as an open dialog, already used the key. */
export const closesOnEscape = ({ key, defaultPrevented }: { key: string; defaultPrevented: boolean }): boolean =>
  key === 'Escape' && !defaultPrevented;
