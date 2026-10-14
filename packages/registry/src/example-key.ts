const DEFAULT_EXAMPLE = 'default';

const EXAMPLE_KEY = /^([^.]+)\.(?:(.+)\.)?example$/;

/** The key an example is known by in the docs: `<item>.example` for the default one, `<item>.<example>.example` otherwise. */
export const exampleKey = (itemName: string, exampleName: string): string =>
  exampleName === DEFAULT_EXAMPLE ? `${itemName}.example` : `${itemName}.${exampleName}.example`;

export interface ParsedExampleKey {
  itemName: string;
  exampleName: string;
}

export const parseExampleKey = (key: string): ParsedExampleKey | null => {
  const match = EXAMPLE_KEY.exec(key);
  return match && { itemName: match[1] as string, exampleName: match[2] ?? DEFAULT_EXAMPLE };
};
