import { SHUIP_MARK } from '@/lib/shuip-mark';

export function ShuipMark({ className, size }: { className?: string; size?: number }) {
  const { viewBox, strokeWidth, strokeLinecap, arcs } = SHUIP_MARK;
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox={viewBox}
      aria-hidden='true'
      className={className}
      width={size}
      height={size}
    >
      {arcs.map(({ d, ...arc }) => (
        <path
          key={d}
          d={d}
          fill='none'
          stroke='currentColor'
          strokeWidth={strokeWidth}
          strokeLinecap={strokeLinecap}
          {...arc}
        />
      ))}
    </svg>
  );
}
