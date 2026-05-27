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
