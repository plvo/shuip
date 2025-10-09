import { REGISTRY_INDEX } from '#/registry/__index__';
import { filenameToTitle } from '@/lib/utils';
import { useMDXComponents } from '@/mdx-components';
import { InstallationCmd } from './item-installation';
import { ItemPreview, Preview } from './item-preview';
export interface ItemHeaderProps {
  registryName: string;
  text?: string;
}

export async function ItemHeader({ registryName, text }: ItemHeaderProps) {
  const { h2: H2 } = useMDXComponents();
  const code = REGISTRY_INDEX[registryName]?.code;

  return (
    <>
      {text && <p>{text}</p>}
      <InstallationCmd registryPath={registryName} manualCode={code} />
      <H2>Preview</H2>
      <Preview registryName={`${registryName}.example`} />
    </>
  );
}

export interface ItemExamplesProps {
  registryName: string;
}

export async function ItemExamples({ registryName }: ItemExamplesProps) {
  const { h2: H2, h3: H3 } = useMDXComponents();

  const examples = Object.keys(REGISTRY_INDEX).filter((example) => {
    const splitted = example.split('.');
    return splitted.shift() === registryName && splitted.pop() === 'example';
  });

  return (
    <>
      <H2>Examples</H2>
      {examples.length ? (
        examples.sort().map((example) => (
          <div key={example} className='my-6 space-y-4'>
            <H3>{example === `${registryName}.example` ? 'Default' : filenameToTitle(example.split('.')[1])}</H3>
            <ItemPreview registryName={example} />
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
