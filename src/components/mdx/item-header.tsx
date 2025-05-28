'use client';

import { ItemInstallation } from './item-installation';
import { Preview } from './item-preview';

export interface ItemHeaderProps {
  filename: string;
  text: string;
}

export function ItemHeader({ filename, text }: ItemHeaderProps) {
  return (
    <>
      <p>{text}</p>
      <div>
        <h2 id='installation' className={'h2-mdx'}>
          Installation
        </h2>
        <ItemInstallation filename={filename} />
      </div>
      <div>
        <h2 id='examples' className={'h2-mdx'}>
          Preview
        </h2>
        <Preview filename={`${filename}.example`} />
      </div>
    </>
  );
}
