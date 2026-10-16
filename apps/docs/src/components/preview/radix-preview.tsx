'use client';

import { REGISTRY_INDEX } from '@repo/registry/__index__';
import { PreviewFrame, type PreviewFrameProps } from './preview-frame';

export function RadixPreview({ registryName, className }: Omit<PreviewFrameProps, 'component'>) {
  return (
    <PreviewFrame
      registryName={registryName}
      component={REGISTRY_INDEX[registryName]?.component}
      className={className}
    />
  );
}
