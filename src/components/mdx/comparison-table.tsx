import type React from 'react';

export interface ComparisonRow {
  aspect: string;
  simple: string;
  composed: string;
}

export interface ComparisonTableProps {
  rows: ComparisonRow[];
  headers?: {
    aspect?: string;
    simple?: string;
    composed?: string;
  };
}

export function ComparisonTable({ rows, headers }: ComparisonTableProps) {
  const defaultHeaders = {
    aspect: headers?.aspect ?? 'Aspect',
    simple: headers?.simple ?? 'Simple Pattern',
    composed: headers?.composed ?? 'Composed Pattern',
  };

  return (
    <div className='my-6 w-full overflow-x-auto'>
      <table className='w-full border-collapse'>
        <thead>
          <tr className='border-b border-border bg-muted/50'>
            <th className='px-4 py-3 text-left text-sm font-semibold'>{defaultHeaders.aspect}</th>
            <th className='px-4 py-3 text-left text-sm font-semibold'>{defaultHeaders.simple}</th>
            <th className='px-4 py-3 text-left text-sm font-semibold'>{defaultHeaders.composed}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.aspect}
              className={`border-b border-border ${index % 2 === 0 ? 'bg-background' : 'bg-muted/30'}`}
            >
              <td className='px-4 py-3 text-sm font-medium'>{row.aspect}</td>
              <td className='px-4 py-3 text-sm text-muted-foreground'>{row.simple}</td>
              <td className='px-4 py-3 text-sm text-muted-foreground'>{row.composed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
