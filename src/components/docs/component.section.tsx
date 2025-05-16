import { cn, filenameToTitle } from '@/lib/utils';
import * as React from 'react';
import CodePreview from '../shared/code-preview';
import ComponentInstallation from './component.installation';
import { ComponentPreview } from './component.preview';

interface ComponentSectionsProps {
  componentName: string;
  examples: string[];
}

export default function ComponentSection({ componentName, examples }: ComponentSectionsProps) {
  const componentNameExample = `${componentName}.example`;
  const exampleComponents = examples.filter((e) => e !== componentName);

  return (
    <section className='w-full max-w-4xl space-y-8'>
      <ComponentPreview filename={componentNameExample} />

      <div>
        <h2 id='installation' className={cn('h2-mdx')}>
          Installation
        </h2>
        <ComponentInstallation filename={componentName} />
      </div>

      <div>
        <h2 id='usage' className={cn('h2-mdx')}>
          Usage
        </h2>
        <CodePreview filename={componentNameExample} />
      </div>

      {exampleComponents.length > 0 && (
        <div>
          <h2 id='examples' className={cn('h2-mdx')}>
            Examples
          </h2>
          {exampleComponents.map((example) => (
            <ComponentPreview key={example} filename={`${example}.example`} />
          ))}
        </div>
      )}
    </section>
  );
}
