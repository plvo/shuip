import React from 'react';
import { examplesIndex, registryIndex } from '#/registry/__index__';
import { filenameToTitle } from '@/lib/utils';
import { ItemInstallation } from './item-installation';
import { ItemPreview, Preview } from './item-preview';

export interface ItemHeaderProps {
  registryName: string;
  text?: string;
}

export async function ItemHeader({ registryName, text }: ItemHeaderProps) {
  return (
    <>
      {text && <p>{text}</p>}
      <h2 id={`installation-${registryName}`} className={'h2-mdx'}>
        Installation
      </h2>
      <ItemInstallation registryPath={registryName} />
      <h2 id={`preview-${registryName}`} className={'h2-mdx'}>
        Preview
      </h2>
      <Preview registryName={registryName} />
    </>
  );
}

export interface ItemExamplesProps {
  registryName: string;
}

export async function ItemExamples({ registryName }: ItemExamplesProps) {
  const code = registryIndex[registryName]?.code;
  const examples = Object.keys(examplesIndex).filter((example) => example.startsWith(registryName));

  return (
    <>
      <h2 id={`examples-${registryName}`} className={'h2-mdx'}>
        Examples
      </h2>
      {examples.length ? (
        examples.sort().map((example) => (
          <div key={example} className='my-6 space-y-4'>
            <h3 className='h3-mdx'>
              {example}
              {example === `${registryName}` ? 'Default' : filenameToTitle(example.split('.')[1])}
            </h3>
            <React.Suspense fallback={<div>Loading...</div>}>
              <ItemPreview registryName={example} code={code} />
            </React.Suspense>
          </div>
        ))
      ) : (
        <p className='text-sm text-muted-foreground'>No examples</p>
      )}
    </>
  );
}

export interface Prop {
  name: string;
  type: string;
  description: string;
}

export function PropTable({ props }: { props: Prop[] }) {
  return (
    <>
      <h2 id={`props`} className={'h2-mdx'}>
        Props
      </h2>

      <table className={'w-full border-collapse border-spacing-0 my-6 border border-border rounded-lg overflow-hidden'}>
        <thead className={'bg-muted/50'}>
          <tr>
            <th className={'h-12 px-4 text-left align-middle font-semibold text-muted-foreground'}>Name</th>
            <th className={'h-12 px-4 text-left align-middle font-semibold text-muted-foreground'}>Type</th>
            <th className={'h-12 px-4 text-left align-middle font-semibold text-muted-foreground'}>Description</th>
          </tr>
        </thead>
        <tbody className={'bg-background'}>
          {props.map((prop) => (
            <tr key={prop.name} className={'border-b border-border transition-colors hover:bg-muted/50'}>
              <td className={'p-4 align-middle'}>{prop.name}</td>
              <td className={'p-4 align-middle'}>
                <code className='rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm'>{prop.type}</code>
              </td>
              <td className={'p-4 align-middle'}>{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
