'use client';

import { Skeleton } from '@/components/ui/skeleton';

export interface SkeletonTextProps {
  text: string | undefined;
}

export const SkeletonText = ({ text }: SkeletonTextProps) => {
  if (!text) return <Skeleton className="w-20 h-4" />;
  return text;
};
