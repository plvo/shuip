'use client';

import { REGISTRY_INDEX } from '@repo/registry/__index__';
import { PreviewFrame } from '@/components/item-preview';

export function RadixPreview({ registryName }: { registryName: string }) {
  return <PreviewFrame registryName={registryName} component={REGISTRY_INDEX[registryName]?.component} />;
}
