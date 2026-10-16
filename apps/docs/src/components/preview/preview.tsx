import type { Base } from '@/lib/base-routes';
import { previewLabel, previewUrl } from '@/lib/preview-routes';
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
}

/** A preview card of an example, with the button that opens it full page. */
export function Preview({ base, registryName, slot = 'page' }: PreviewProps) {
  const BasePreview = previewFor(base);
  return (
    <PreviewCard
      registryName={registryName}
      slot={slot}
      href={previewUrl(base, registryName)}
      label={previewLabel(registryName)}
    >
      <BasePreview registryName={registryName} />
    </PreviewCard>
  );
}
