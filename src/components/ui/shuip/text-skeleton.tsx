import { Skeleton } from '@/components/ui/skeleton';

export interface TextSkeletonProps extends React.RefAttributes<HTMLDivElement> {
  text: string | undefined;
}

export function TextSkeleton({ text, ...props }: TextSkeletonProps) {
  if (!text) return <Skeleton className='w-20 h-4' {...props} />;
  return text;
}
