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

/** Reads `meta.shuip.json`: `dependsOn` and the authored registry fields. The generator derives the rest and rejects it here. */
export const readItemMeta = (itemDir: string): ItemMeta => {
  const metaPath = path.join(itemDir, 'meta.shuip.json');
  if (!fs.existsSync(metaPath)) return {};

  const raw: unknown = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
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
