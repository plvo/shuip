'use client';

import type { JSX } from 'react';
import TitleSection from '../ui/div.title-section';

export interface TitleSectionProps {
  title: string;
  description: string | JSX.Element;
}

export default function TitleSectionExample() {
  return <TitleSection title="Title" description="Lorem ipsum dolor sit amet consectetur, adipisicing elit." />;
}
