import { parseExampleKey } from '@repo/registry/example-key';
import type { Base } from '@/lib/base-routes';
import { previewPageOf } from '@/lib/preview-pages';
import { previewCardWiring } from '@/lib/preview-routes';
import { BaseUiPreview } from './base-ui-preview';
import { PreviewCard } from './preview-card';
import { RadixPreview } from './radix-preview';

const PREVIEWS = { base: BaseUiPreview, radix: RadixPreview } satisfies Record<Base, unknown>;

export const previewFor = (base: Base) => PREVIEWS[base];

export interface PreviewProps {
  base: Base;
  registryName: string;
  /** Tells apart the cards of one page that show the same example; they must not share one. */
  slot?: string;
  /** Without the button that opens the example full page: for a thumbnail that is a link to the page of its item. */
  expandable?: boolean;
}

/** A preview card of an example, with the button that opens it full page. */
export function Preview({ base, registryName, slot = 'page', expandable = true }: PreviewProps) {
  const BasePreview = previewFor(base);
  if (!expandable) return <BasePreview registryName={registryName} />;

  const item = parseExampleKey(registryName)?.itemName;
  const itemTitle = item ? previewPageOf(base, item)?.title : undefined;
  return (
    <PreviewCard {...previewCardWiring(base, registryName, slot, itemTitle)}>
      <BasePreview registryName={registryName} />
    </PreviewCard>
  );
}
