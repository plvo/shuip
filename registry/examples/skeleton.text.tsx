import { SkeletonText } from '../ui/skeleton.text';

export interface SkeletonTextProps {
  text: string | undefined;
}

export default function SkeletonTextExample() {
  return <SkeletonText text="Hello" />;
}
