import type { Base } from '@/lib/base-routes';
import { BaseUiPreview } from './base-ui-preview';
import { RadixPreview } from './radix-preview';

const PREVIEWS = { base: BaseUiPreview, radix: RadixPreview } satisfies Record<Base, unknown>;

export const previewFor = (base: Base) => PREVIEWS[base];

export function Preview({ base, registryName }: { base: Base; registryName: string }) {
  const BasePreview = previewFor(base);
  return <BasePreview registryName={registryName} />;
}
