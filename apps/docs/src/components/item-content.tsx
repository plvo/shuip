import path from 'node:path';
import { listItemExamples, readItemSource } from '@repo/registry/item-source';
import type { Base } from '@/lib/base-routes';
import { filenameToTitle } from '@/lib/utils';
import { useMDXComponents } from '@/mdx-components';
import { InstallationCmd } from './item-installation';
import { ItemPreview } from './item-preview';
import { Preview } from './preview';

const REGISTRY_ROOT = path.resolve(process.cwd(), '../../packages/registry');

export interface ItemHeaderProps {
  base: Base;
  registryName: string;
  text?: string;
}

export async function ItemHeader({ base, registryName, text }: ItemHeaderProps) {
  const code = readItemSource(base, registryName, REGISTRY_ROOT);

  return (
    <div className='space-y-4'>
      {text && <p>{text}</p>}
      <InstallationCmd itemName={registryName} manualCode={code} />
      <Preview base={base} registryName={`${registryName}.example`} />
    </div>
  );
}

export interface ItemExamplesProps {
  base: Base;
  registryName: string;
}

export async function ItemExamples({ base, registryName }: ItemExamplesProps) {
  const { h3: H3 } = useMDXComponents();

  const examples = listItemExamples(base, registryName, REGISTRY_ROOT);

  if (!examples.length) {
    return <p className='text-sm text-muted-foreground'>No examples</p>;
  }

  return examples.map((example) => (
    <div key={example} className='my-6 space-y-4'>
      <H3>{example === `${registryName}.example` ? 'Default' : filenameToTitle(example.split('.')[1])}</H3>
      <ItemPreview code={readItemSource(base, example, REGISTRY_ROOT)}>
        <Preview base={base} registryName={example} />
      </ItemPreview>
    </div>
  ));
}

export interface Prop {
  name: string;
  type: string;
  description: string;
}

export function PropTable({ props, title }: { props: Prop[]; title?: string }) {
  const { h2: H2 } = useMDXComponents();

  return (
    <>
      <H2>{title || 'Props'}</H2>
      <table className={'w-full border-collapse border-spacing-0 my-6 border border-border rounded-lg overflow-hidden'}>
        <thead className={'bg-muted/50'}>
          <tr>
            <th className={'h-12 px-4 text-left align-middle font-semibold text-muted-foreground'}>Name</th>
            <th className={'h-12 px-4 text-left align-middle font-semibold text-muted-foreground'}>Type</th>
            <th className={'h-12 px-4 text-left align-middle font-semibold text-muted-foreground'}>Description</th>
          </tr>
        </thead>
        <tbody className={'bg-background'}>
          {props.map((prop, i) => (
            <tr key={`${prop.name}-${i}`} className={'border-b border-border transition-colors hover:bg-muted/50'}>
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
