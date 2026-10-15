import { llmsRoute } from '@/lib/llms-route';
import { componentsSources } from '@/lib/source';

export const revalidate = false;

export const dynamicParams = false;

export const { GET, generateStaticParams } = llmsRoute(componentsSources);
