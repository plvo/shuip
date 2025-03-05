import * as React from 'react';
import InstallationCmd from '../shared/installation-cmd';
import { cn, findComponentContent, stringToUppercase } from '@/lib/utils';
import { ComponentPreview } from './component.preview';
import { MdxContent } from '../shared/mdx-components';
import CodePreview from '../shared/code-preview';
import ComponentInstallation from './component.installation';

interface ComponentSectionsProps {
  // key ui component, value array of examples
  component: [string, string[]];
}

export default function ComponentSections({ component }: ComponentSectionsProps) {
  const [key, examples] = component;
  const componentContent = findComponentContent(key);
  const title = key
    .split('.')
    .map((w) => stringToUppercase(w))
    .join(' ');

  return (
    <section className="w-full">
      <h2 className="h2-mdx mb-3" id={key}>
        {componentContent?.title || title}
      </h2>
      {componentContent && <MdxContent code={componentContent.body.code} />}
      <ComponentPreview name={key + '.example'} />

      <h3 className={cn('h3-mdx')}>Installation</h3>
      <ComponentInstallation filename={key} />

      <h3 className={cn('h3-mdx')}>Usage</h3>
      <CodePreview filename={key + '.example'} />

      {examples.length > 1 && (
        <>
          <h3 className={cn('h3-mdx')}>Examples</h3>
          {examples.map((example) => (
            <ComponentPreview key={example} name={example + '.example'} type="example" />
          ))}
        </>
      )}
    </section>
  );
}
