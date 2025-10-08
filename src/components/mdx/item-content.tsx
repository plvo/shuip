import React from 'react';
import { getExamplesByFilePath } from '@/actions/docs';
import { cn, filenameToTitle } from '@/lib/utils';
import { ItemInstallation } from './item-installation';
import { ItemPreview, Preview } from './item-preview';

export interface ItemHeaderProps {
  registryPath: string;
  text?: string;
}

export function ItemHeader({ registryPath, text }: ItemHeaderProps) {
  return (
    <>
      <p>{text}</p>
      <h2 id={`installation-${registryPath}`} className={'h2-mdx'}>
        Installation
      </h2>
      <ItemInstallation registryPath={registryPath} />
      <h2 id={`preview-${registryPath}`} className={'h2-mdx'}>
        Preview
      </h2>
      <Preview registryPath={registryPath} />
    </>
  );
}

export interface Prop {
  name: string;
  type: string;
  description: string;
}

export interface ItemFooterProps {
  registryPath: string;
  props?: Prop[];
}

export function ItemFooter({ registryPath, props }: ItemFooterProps) {
  return (
    <>
      <h2 id={`examples-${registryPath}`} className={'h2-mdx'}>
        Examples
      </h2>
      <ItemExamples registryPath={registryPath} />
      <h2 id={`props-${registryPath}`} className={'h2-mdx'}>
        Props
      </h2>
      {props ? <PropTable props={props} /> : <p className='text-sm text-muted-foreground'>No props</p>}
    </>
  );
}

function ItemExamples({ registryPath }: { registryPath: string }) {
  const examples = React.use(getExamplesByFilePath(registryPath));

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      {examples.length ? (
        examples.sort().map((example) => (
          <div key={example} className='my-6 space-y-4'>
            <h3 className='h3-mdx'>
              {example}
              {example === `${registryPath}` ? 'Default' : filenameToTitle(example.split('.')[1])}
            </h3>
            <ItemPreview registryPath={example} />
          </div>
        ))
      ) : (
        <p className='text-sm text-muted-foreground'>No examples</p>
      )}
    </React.Suspense>
  );
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
