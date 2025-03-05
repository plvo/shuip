import type { JSX } from 'react';

export interface TitleSectionProps {
  title: string;
  description: string | JSX.Element;
}

export default function TitleSection({ title, description }: TitleSectionProps) {
  return (
    <div className="text-center -space-y-2 my-6 max-md:text-sm">
      <h1 className="text-4xl md:text-5xl font-bold">{title}</h1>
      <p className="opacity-80 text-center">{description}</p>
    </div>
  );
}
