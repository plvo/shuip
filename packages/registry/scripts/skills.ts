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
