import { cn, filenameToTitle } from '@/lib/utils';
import * as React from 'react';
import { COMPONENT_CATEGORIES } from '#/registry/__index__';
import { ItemPreview } from './item-preview';

interface Prop {
  name: string;
  type: string;
  description: string;
}

export interface ItemFooterProps {
  itemName: string;
  props: Prop[];
}

export function ItemFooter({ itemName, props }: ItemFooterProps) {
  return (
    <>
      <div>
        <h2 id='examples' className={'h2-mdx'}>
          Examples
        </h2>

        <ItemExamples itemName={itemName} />
      </div>

      <div>
        <h2 id='props' className={'h2-mdx'}>
          Props
        </h2>
        <PropTable props={props} />
      </div>
    </>
  );
}

function ItemExamples({ itemName }: { itemName: string }) {
  const examples = COMPONENT_CATEGORIES[itemName] || null;

  if (examples.length) {
    return examples.sort().map((example) => (
      <div key={example} className='my-6 space-y-4'>
        <h3 className='h3-mdx'>
          {example === `${itemName}.example` ? 'Default' : filenameToTitle(example.split('.')[1])}
        </h3>
        <ItemPreview filename={example} />
      </div>
    ));
  }
}

function PropTable({ props }: { props: Prop[] }) {
  return (
    <table
      className={cn('w-full border-collapse border-spacing-0 my-6', 'border border-border rounded-lg overflow-hidden')}
    >
      <thead className={cn('bg-muted/50')}>
        <tr>
          <th className={cn('h-12 px-4 text-left align-middle font-semibold text-muted-foreground')}>Name</th>
          <th className={cn('h-12 px-4 text-left align-middle font-semibold text-muted-foreground')}>Type</th>
          <th className={cn('h-12 px-4 text-left align-middle font-semibold text-muted-foreground')}>Description</th>
        </tr>
      </thead>
      <tbody className={cn('bg-background')}>
        {props.map((prop) => (
          <tr key={prop.name} className={cn('border-b border-border transition-colors', 'hover:bg-muted/50')}>
            <td className={cn('p-4 align-middle')}>{prop.name}</td>
            <td className={cn('p-4 align-middle')}>
              <code className='rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm'>{prop.type}</code>
            </td>
            <td className={cn('p-4 align-middle')}>{prop.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
