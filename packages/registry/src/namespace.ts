export const SHUIP_NAMESPACE = '@shuip';

export const SHUIP_REGISTRY_URL = 'https://shuip.plvo.dev/r/{style}/{name}.json';

export const shuipItemRef = (name: string): string => `${SHUIP_NAMESPACE}/${name}`;
