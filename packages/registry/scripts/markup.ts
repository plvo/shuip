/** The attributes of the first `<tag …>` element of static markup, as the browser would read them. */
export function firstElementAttributes(markup: string, tag: string): Record<string, string> {
  const opening = markup.match(new RegExp(`<${tag}\\b[^>]*>`))?.[0] ?? '';
  return Object.fromEntries([...opening.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]));
}
