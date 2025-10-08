/**
 * @description Frontmatter for MDX files
 * @example
 * ```mdx
 * ---
 * title: "My Title"
 * description: "My Description"
 * position: "1"
 * registryName: "My Registry Name"
 * ---
 * ```
 */
export interface MdxFrontmatter {
  title?: string;
  description?: string;
  position?: string;
  registryName?: string;
  urlToFetch?: string;
}

export interface ParsedFrontmatterReturn {
  metadata: Partial<MdxFrontmatter>;
  mdxContent: string;
}
