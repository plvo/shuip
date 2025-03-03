import * as React from 'react';
import InstallationCmd from './installation-cmd';
import { cn, stringToUppercase } from '@/lib/utils';
import { ComponentPreview } from './component.preview';

interface ComponentSectionsProps {
  // key ui component, value array of examples
  component: [string, string[]];
}

export default function ComponentSections({ component }: ComponentSectionsProps) {
  const [key, examples] = component;

  const title = key
    .split('.')
    .map((w) => stringToUppercase(w))
    .join(' ');

  return (
    <section>
      <h2 className="font-heading mt-12 scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight first:mt-0">
        {title}
      </h2>
      <ComponentPreview name={key} />

      <h3 className={cn('h3-mdx')}>Installation</h3>
      <InstallationCmd name={key} />

      <h3 className={cn('h3-mdx')}>Usage</h3>

      <h3 className={cn('h3-mdx')}>Examples</h3>
      {examples.length > 0 ? (
        examples.map((example) => <ComponentPreview key={example} name={example} type="example" />)
      ) : (
        <p className="text-sm text-muted-foreground">No examples found for this component.</p>
      )}
    </section>
  );
}
