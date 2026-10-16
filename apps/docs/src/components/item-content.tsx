import { parseExampleKey } from '@repo/registry/example-key';
import type { Base } from '@/lib/base-routes';
import { itemSourcesFor } from '@/lib/item-sources';
import { filenameToTitle } from '@/lib/utils';
import { useMDXComponents } from '@/mdx-components';
import { InstallationCmd } from './item-installation';
import { ItemPreview } from './item-preview';
import { Preview } from './preview/preview';

export interface ItemHeaderProps {
  base: Base;
  registryName: string;
  text?: string;
}

export async function ItemHeader({ base, registryName, text }: ItemHeaderProps) {
  const { code } = itemSourcesFor(base, registryName);

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

  const { examples } = itemSourcesFor(base, registryName);

  if (!examples.length) {
    return <p className='text-sm text-muted-foreground'>No examples</p>;
  }

  return examples.map(({ key, code }) => (
    <div key={key} className='my-6 space-y-4'>
      <H3>
        {key === `${registryName}.example` ? 'Default' : filenameToTitle(parseExampleKey(key)?.exampleName ?? key)}
      </H3>
      <ItemPreview exampleKey={key} code={code}>
        <Preview base={base} registryName={key} />
      </ItemPreview>
    </div>
  ));
}
