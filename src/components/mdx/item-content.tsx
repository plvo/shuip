import { REGISTRY_INDEX } from '#/registry/__index__';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { filenameToTitle } from '@/lib/utils';
import { useMDXComponents } from '@/mdx-components';
import { CodePreview } from './code-preview';
import { InstallationCmd } from './item-installation';
import { ItemPreview, Preview } from './item-preview';
export interface ItemHeaderProps {
  registryName: string;
  text?: string;
}

export async function ItemHeader({ registryName, text }: ItemHeaderProps) {
  const { h2: H2 } = useMDXComponents();

  return (
    <>
      {text && <p>{text}</p>}
      <H2 id={`installation-${registryName}`}>Installation</H2>
      <ItemInstallation registryPath={registryName} />
      <H2 id={`preview-${registryName}`}>Preview</H2>
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
      <H2 id={`examples-${registryName}`}>Examples</H2>
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

export function PropTable({ props }: { props: Prop[] }) {
  const { h2: H2 } = useMDXComponents();

  return (
    <>
      <H2 id={'props'}>Props</H2>
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

function ItemInstallation({ registryPath }: { registryPath: string }) {
  const code = REGISTRY_INDEX[registryPath]?.code;

  return (
    <div className={'flex flex-col space-y-2'}>
      <Tabs defaultValue='cli' className='relative mr-auto w-full'>
        <div className='flex items-center justify-between pb-2'>
          <TabsList className='w-full justify-start rounded-none border-b bg-transparent p-0'>
            <TabsTrigger value='cli' className='table-trigger'>
              CLI
            </TabsTrigger>
            <TabsTrigger value='manual' className='table-trigger'>
              Manual
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value='cli'>
          <InstallationCmd registryPath={registryPath} />
        </TabsContent>
        <TabsContent value='manual'>
          <p className='text-muted-foreground pb-2'>Copy the following code and paste it into your project.</p>
          {code ? (
            <CodePreview code={code} />
          ) : (
            <p className='text-sm text-muted-foreground'>Component not found in registry.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
