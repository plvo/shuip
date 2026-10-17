import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { authoredFieldsSchema } from '../src/authored-fields';

export const DERIVED_FIELDS = ['name', 'type', 'dependencies', 'registryDependencies', 'files', 'target'];

const itemMetaSchema = z.strictObject({
  dependsOn: z.array(z.string()).optional(),
  ...authoredFieldsSchema.shape,
});

export type ItemMeta = z.infer<typeof itemMetaSchema>;

const parseJson = (filePath: string): unknown => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    throw new Error(`[generate] ${filePath} is not valid JSON: ${(error as Error).message}`);
  }
};

/** Reads `meta.shuip.json`: `dependsOn` and the authored registry fields. The generator derives the rest and rejects it here. */
export const readItemMeta = (itemDir: string): ItemMeta => {
  const metaPath = path.join(itemDir, 'meta.shuip.json');
  if (!fs.existsSync(metaPath)) return {};

  const raw = parseJson(metaPath);
  const derived = typeof raw === 'object' && raw !== null ? DERIVED_FIELDS.filter((field) => field in raw) : [];
  if (derived.length > 0) {
    throw new Error(
      `[generate] ${metaPath} sets ${derived.map((field) => `"${field}"`).join(', ')}, which the generator derives from the item's files`,
    );
  }
  const result = itemMetaSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`[generate] ${metaPath} is invalid:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
};
