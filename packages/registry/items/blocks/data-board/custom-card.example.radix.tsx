'use client';

import { CircleCheck, CircleDashed, CircleDot } from 'lucide-react';
import * as React from 'react';
import { DataBoard, type DataBoardColumn } from '@/components/block/shuip/data-board';
import { Badge } from '@/components/ui/badge';

type Deal = {
  id: string;
  company: string;
  value: number;
  probability: number;
  stage: string;
};

const COLUMNS: DataBoardColumn[] = [
  { id: 'lead', label: 'Lead', icon: CircleDashed },
  { id: 'negotiation', label: 'Negotiation', icon: CircleDot, accentClassName: 'text-primary' },
  { id: 'won', label: 'Won', icon: CircleCheck, accentClassName: 'text-foreground' },
];

const DEALS: Deal[] = [
  { id: 'd1', company: 'Northwind', value: 24000, probability: 40, stage: 'lead' },
  { id: 'd2', company: 'Initech', value: 8000, probability: 60, stage: 'lead' },
  { id: 'd3', company: 'Contoso', value: 51000, probability: 75, stage: 'negotiation' },
  { id: 'd4', company: 'Umbrella', value: 12500, probability: 90, stage: 'negotiation' },
  { id: 'd5', company: 'Globex', value: 33000, probability: 100, stage: 'won' },
];

const money = (amount: number) => `$${amount.toLocaleString('en-US')}`;

export default function DataBoardCustomCardExample() {
  const [deals, setDeals] = React.useState(DEALS);

  return (
    <div className='flex h-[28rem] flex-col'>
      <DataBoard<Deal>
        columns={COLUMNS}
        data={deals}
        onDataChange={setDeals}
        columnField='stage'
        title={(deal) => deal.company}
        cardContent={(deal) => (
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span className='font-medium text-foreground'>{money(deal.value)}</span>
            <span>{deal.probability}%</span>
          </div>
        )}
        cardClassName={(deal) => (deal.probability >= 90 ? 'border-primary' : undefined)}
        wrapCard={(deal, card) => (
          <div className='relative'>
            {card}
            {deal.value >= 50000 ? <Badge className='-top-1.5 -right-1.5 absolute'>Key</Badge> : null}
          </div>
        )}
        renderColumnSummary={(items) => money(items.reduce((total, deal) => total + deal.value, 0))}
        onCardMove={(event) => console.log('moved', event.item.id, '->', event.toColumn)}
      />
    </div>
  );
}
