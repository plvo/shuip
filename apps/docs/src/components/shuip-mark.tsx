/** The shuip mark: two arcs forming an "S", the second at reduced opacity. Keep in step with `src/assets/shuip-mark.svg`. */
export function ShuipMark({ className }: { className?: string }) {
  return (
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' aria-hidden='true' className={className}>
      <path d='M21 11A5 5 0 1 0 16 16' fill='none' stroke='currentColor' strokeWidth='4.5' strokeLinecap='round' />
      <path
        d='M16 16A5 5 0 1 1 11 21'
        fill='none'
        stroke='currentColor'
        strokeWidth='4.5'
        strokeLinecap='round'
        opacity='.45'
      />
    </svg>
  );
}
