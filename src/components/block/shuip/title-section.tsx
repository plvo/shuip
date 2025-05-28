import type * as React from 'react';

export interface TitleSectionProps extends React.RefAttributes<HTMLDivElement> {
  title: string;
  description: string | React.JSX.Element;
}

export function TitleSection({ title, description, ...props }: TitleSectionProps) {
  return (
    <div className='text-center -space-y-2 my-6 max-md:text-sm' {...props}>
      <h1 className='text-4xl md:text-5xl font-bold'>{title}</h1>
      <p className='opacity-80 text-center'>{description}</p>
    </div>
  );
}
