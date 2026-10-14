'use client';

import { REGISTRY_INDEX } from '@repo/registry/__index__.base';
import { PreviewFrame } from './preview-frame';

export function BaseUiPreview({ registryName }: { registryName: string }) {
  return <PreviewFrame registryName={registryName} component={REGISTRY_INDEX[registryName]?.component} />;
}
