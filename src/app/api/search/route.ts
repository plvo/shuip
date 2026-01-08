import { createFromSource } from 'fumadocs-core/search/server';
import { combinedSource } from '@/lib/source';

export const { GET } = createFromSource(combinedSource, { language: 'english' });
