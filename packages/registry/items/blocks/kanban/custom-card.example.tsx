'use client';

import * as React from 'react';
import { Kanban } from '@/components/block/shuip/kanban';

type Deal = {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: string;
};

const columns = [
  { id: 'lead', label: 'Lead', color: 'var(--color-muted-foreground)' },
  { id: 'qualified', label: 'Qualified', color: 'var(--color-blue-500)' },
  { id: 'negotiation', label: 'Negotiation', color: 'var(--color-amber-500)' },
  { id: 'won', label: 'Won', color: 'var(--color-green-500)' },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const initialDeals: Deal[] = [
  { id: 'd1', name: 'Acme website', company: 'Acme Inc', value: 12000, stage: 'lead' },
  { id: 'd2', name: 'Globex platform', company: 'Globex', value: 48000, stage: 'qualified' },
  { id: 'd3', name: 'Initech migration', company: 'Initech', value: 30000, stage: 'qualified' },
  { id: 'd4', name: 'Umbrella retainer', company: 'Umbrella', value: 60000, stage: 'negotiation' },
  { id: 'd5', name: 'Soylent rebrand', company: 'Soylent', value: 18000, stage: 'won' },
];

export default function KanbanCustomCardExample() {
  const [deals, setDeals] = React.useState<Deal[]>(initialDeals);

  return (
    <Kanban<Deal>
      columns={columns}
      data={deals}
      onDataChange={setDeals}
      columnField='stage'
      titleField='name'
      cardContent={(deal) => (
        <div className='space-y-1 text-xs'>
          <p className='truncate text-muted-foreground'>{deal.company}</p>
          <p className='font-mono'>{formatCurrency(deal.value)}</p>
        </div>
      )}
      renderColumnSummary={(items) => formatCurrency(items.reduce((sum, d) => sum + d.value, 0))}
      onCardMove={(e) => console.log(`${e.item.name}: ${e.fromColumn} -> ${e.toColumn} @ ${e.toIndex}`)}
    />
  );
}
