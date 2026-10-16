'use client';

import { REGISTRY_INDEX } from '@repo/registry/__index__';
import { PreviewFrame, type PreviewFrameProps } from './preview-frame';

export function RadixPreview(props: Omit<PreviewFrameProps, 'component'>) {
  return <PreviewFrame {...props} component={REGISTRY_INDEX[props.registryName]?.component} />;
}
