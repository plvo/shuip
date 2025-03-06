import * as React from 'react';
import { cn, filenameToTitle, findComponentContent } from '@/lib/utils';
import { ComponentPreview } from './component.preview';
import { MdxContent } from '../shared/mdx-components';
import CodePreview from '../shared/code-preview';
import ComponentInstallation from './component.installation';

interface ComponentSectionsProps {
  component: [string, string[]];
}

export default function ComponentSections({ component }: ComponentSectionsProps) {
  const [key, examples] = component;
  const componentContent = findComponentContent(key);
  const title = filenameToTitle(key);

  const exampleComponents = examples.filter((e) => e !== key);

  return (
    <section className="w-full space-y-8">
      <div>
        <h2 className="h2-mdx mb-3" id={key}>
          {componentContent?.title || title}
        </h2>
        {componentContent && <MdxContent code={componentContent.body.code} />}
        <ComponentPreview filename={key + '.example'} />
      </div>

      <div>
        <h3 className={cn('h3-mdx')}>Installation</h3>
        <ComponentInstallation filename={key} />
      </div>

      <div>
        <h3 className={cn('h3-mdx')}>Usage</h3>
        <CodePreview filename={key + '.example'} />
      </div>

      {exampleComponents.length > 0 && (
        <div>
          <h3 className={cn('h3-mdx')}>Examples</h3>
          {exampleComponents.map((example) => (
            <ComponentPreview key={example} filename={example + '.example'} />
          ))}
        </div>
      )}
    </section>
  );
}
