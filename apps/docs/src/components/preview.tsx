import type { Base } from '@/lib/base-routes';
import { BaseUiPreview } from './preview-base-ui';
import { RadixPreview } from './preview-radix';

const PREVIEWS = { base: BaseUiPreview, radix: RadixPreview } satisfies Record<Base, unknown>;

export function Preview({ base, registryName }: { base: Base; registryName: string }) {
  const BasePreview = PREVIEWS[base];
  return <BasePreview registryName={registryName} />;
}
