import fs from 'node:fs';
import path from 'node:path';
import type { RegistryItem } from './generate';

export function parseSkillFrontmatter(source: string): { name: string; description: string } {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error('skill SKILL.md missing YAML frontmatter');
  const block = match[1];
  const name = block.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = block.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  if (!name) throw new Error('skill frontmatter missing "name"');
  if (!description) throw new Error('skill frontmatter missing "description"');
  return { name, description };
}

export interface CatalogItem {
  category: string;
  publishedName: string;
}

const CATALOG_ORDER = ['components', 'blocks', 'react-hook-form', 'tanstack-form', 'tanstack-query'];

export function resolveCatalog(items: CatalogItem[]): string {
  const sections: string[] = [];
  for (const category of CATALOG_ORDER) {
    const names = items
      .filter((i) => i.category === category)
      .map((i) => i.publishedName)
      .sort((a, b) => a.localeCompare(b));
    if (names.length === 0) continue;
    const lines = names.map((n) => `- \`${n}\``).join('\n');
    sections.push(`**${category}**\n${lines}`);
  }
  return sections.join('\n\n');
}

const CATALOG_START = '<!-- shuip:catalog:start -->';
const CATALOG_END = '<!-- shuip:catalog:end -->';

export function applyCatalog(source: string, catalog: string): string {
  if (!source.includes(CATALOG_START)) return source;
  const region = new RegExp(`${CATALOG_START}\\n[\\s\\S]*?\\n${CATALOG_END}`);
  return source.replace(region, `${CATALOG_START}\n${catalog}\n${CATALOG_END}`);
}

export function assertUniqueNames(componentNames: string[], skillNames: string[]): void {
  const taken = new Set(componentNames);
  const clash = skillNames.filter((n) => taken.has(n));
  if (clash.length > 0) {
    throw new Error(`skill name(s) collide with component items: ${clash.join(', ')}`);
  }
}

const SKILL_REGION_RE = /\{\/\* shuip:skill:start name="([^"]+)" \*\/\}\n([\s\S]*?)\n\{\/\* shuip:skill:end \*\/\}/g;

export function applySkillSourcesToDocs(docs: string, sources: Map<string, string>): string {
  return docs.replace(SKILL_REGION_RE, (_match, name: string) => {
    const source = sources.get(name);
    if (source === undefined) {
      throw new Error(`unknown skill "${name}" referenced in docs page`);
    }
    const normalized = source.endsWith('\n') ? source : `${source}\n`;
    return `{/* shuip:skill:start name="${name}" */}\n\`\`\`\`md\n${normalized}\`\`\`\`\n{/* shuip:skill:end */}`;
  });
}

export interface EmitSkillsOptions {
  skillsDir: string;
  generatedDir: string;
  registryRoot: string;
  catalog: string;
  registryBaseUrl: string;
  bundleName: string;
}

export interface EmitSkillsResult {
  items: RegistryItem[];
  sources: Map<string, string>;
}

export function emitSkills(opts: EmitSkillsOptions): EmitSkillsResult {
  const { skillsDir, generatedDir, registryRoot, catalog, registryBaseUrl, bundleName } = opts;
  fs.rmSync(generatedDir, { recursive: true, force: true });
  if (!fs.existsSync(skillsDir)) return { items: [], sources: new Map() };

  const dirs = fs
    .readdirSync(skillsDir)
    .filter((d) => d !== '.generated' && fs.statSync(path.join(skillsDir, d)).isDirectory())
    .sort();

  const items: RegistryItem[] = [];
  const sources = new Map<string, string>();
  const skillNames: string[] = [];

  for (const dir of dirs) {
    const skillMd = path.join(skillsDir, dir, 'SKILL.md');
    if (!fs.existsSync(skillMd)) {
      console.warn(`[generate] skipping skill ${dir}: no SKILL.md`);
      continue;
    }
    const source = fs.readFileSync(skillMd, 'utf-8');
    const { name } = parseSkillFrontmatter(source);
    const resolved = applyCatalog(source, catalog);
    const outPath = path.join(generatedDir, name, 'SKILL.md');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, resolved);
    const relPath = path.relative(registryRoot, outPath).replace(/\\/g, '/');
    items.push({
      name,
      type: 'registry:item',
      files: [{ path: `./${relPath}`, type: 'registry:file', target: `.claude/skills/${name}/SKILL.md` }],
    });
    sources.set(name, source);
    skillNames.push(name);
  }

  if (skillNames.length > 0) {
    items.push({
      name: bundleName,
      type: 'registry:item',
      registryDependencies: skillNames.map((n) => `${registryBaseUrl}/${n}`),
    });
  }

  return { items, sources };
}
