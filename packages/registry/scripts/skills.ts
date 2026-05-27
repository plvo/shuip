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
