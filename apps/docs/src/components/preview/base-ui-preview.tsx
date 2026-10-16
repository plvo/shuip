'use client';

import { REGISTRY_INDEX } from '@repo/registry/__index__.base';
import { PreviewFrame, type PreviewFrameProps } from './preview-frame';

export function BaseUiPreview({ registryName, className }: Omit<PreviewFrameProps, 'component'>) {
  return (
    <PreviewFrame
      registryName={registryName}
      component={REGISTRY_INDEX[registryName]?.component}
      className={className}
    />
  );
}
