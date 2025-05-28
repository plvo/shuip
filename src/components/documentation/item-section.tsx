import { cn } from '@/lib/utils';
import * as React from 'react';
import CodePreview from '../shared/code-preview';
import ItemInstallation from './item-installation';
import ItemPreview from './item-preview';

interface ItemSectionProps {
  componentName: string;
  examples: string[];
}

export default function ItemSection({ componentName, examples }: ItemSectionProps) {
  const componentNameExample = `${componentName}.example`;
  const exampleComponents = examples.filter((e) => e !== componentName);

  return (
    <section className='w-full space-y-8 max-w-[950px] mx-auto'>
      <ItemPreview filename={componentNameExample} />

      <div>
        <h2 id='installation' className={cn('h2-mdx')}>
          Installation
        </h2>
        <ItemInstallation filename={componentName} />
      </div>

      <div>
        <h2 id='usage' className={cn('h2-mdx')}>
          Usage
        </h2>
        <CodePreview filename={componentNameExample} />
      </div>

      {!!exampleComponents.length && (
        <div className='space-y-8'>
          <h2 id='examples' className={cn('h2-mdx')}>
            Examples
          </h2>
          {exampleComponents.map((example) => (
            <ItemPreview key={example} filename={example} />
          ))}
        </div>
      )}
    </section>
  );
}
