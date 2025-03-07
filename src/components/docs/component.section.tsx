import * as React from 'react';
import { cn } from '@/lib/utils';
import { ComponentPreview } from './component.preview';
import CodePreview from '../shared/code-preview';
import ComponentInstallation from './component.installation';

interface ComponentSectionsProps {
  componentName: string;
  examples: string[];
}

export default function ComponentSection({ componentName, examples }: ComponentSectionsProps) {
  const componentNameExample = componentName + '.example';
  const exampleComponents = examples.filter((e) => e !== componentName);

  return (
    <section className="w-full space-y-8">
      <ComponentPreview filename={componentNameExample} />

      <div>
        <h2 id="installation" className={cn('h2-mdx')}>
          Installation
        </h2>
        <ComponentInstallation filename={componentName} />
      </div>

      <div>
        <h2 id="usage" className={cn('h2-mdx')}>
          Usage
        </h2>
        <CodePreview filename={componentNameExample} />
      </div>

      {exampleComponents.length > 0 && (
        <div>
          <h2 id="examples" className={cn('h2-mdx')}>
            Examples
          </h2>
          {exampleComponents.map((example) => (
            <ComponentPreview key={example} filename={componentNameExample} />
          ))}
        </div>
      )}
    </section>
  );
}
