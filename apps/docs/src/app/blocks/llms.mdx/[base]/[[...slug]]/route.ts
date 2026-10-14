import { llmsRoute } from '@/lib/llms-route';

export const revalidate = false;

export const dynamicParams = false;

export const { GET, generateStaticParams } = llmsRoute('blocks');
