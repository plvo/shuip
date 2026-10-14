export const SHUIP_NAMESPACE = '@shuip';

export const SHUIP_ORIGIN = 'https://shuip.plvo.dev';

export const shuipRegistryUrl = (origin: string = SHUIP_ORIGIN): string => `${origin}/r/{style}/{name}.json`;

export const SHUIP_REGISTRY_URL = shuipRegistryUrl();

export const shuipItemRef = (name: string): string => `${SHUIP_NAMESPACE}/${name}`;
