# Components Gallery + Top-Level Routing Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move all registry items from `/docs/<cat>/*` to a new top-level `/components/*` section whose landing page is a category-grouped gallery of live preview cards, and give `/blocks` the same preview-card treatment.

**Architecture:** Add a third fumadocs collection `components` (parallel to `docs` and `blocks`). The registry generator is retargeted to emit item doc-symlinks under `content/components/` instead of `content/docs/`. A shared lazy-on-scroll `<LazyPreview>` powers both the new `<ComponentsGallery>` (grid, grouped by category) and the reworked `<BlocksList>` (single column). `/docs` keeps only guide pages.

**Tech Stack:** Next.js 16, React 19, fumadocs v16 (`fumadocs-mdx`, `fumadocs-core`, `fumadocs-ui`), Tailwind v4, Bun, Biome.

**Testing note:** This repo has **no test runner** (per CLAUDE.md). Verification gates are: `bunx fumadocs-mdx` (regenerate `.source` types) → `bunx tsc --noEmit` in `apps/docs` for fast type feedback, `bun build:docs` from repo root for the full build gate, plus shell assertions and the manual checklist in the final task. Work is committed on branch `feat/components-gallery-routing`.

**Conventions:** Biome — single quotes, 2-space indent, 120 cols, trailing commas. Run `bun check` before each commit (lint-staged also runs it on commit). Commit messages follow Conventional Commits.

---

## Task 1: Retarget the generator to `content/components` and regenerate

The generator currently writes item doc-symlinks to `apps/docs/content/docs/<cat>/`. Point it at `content/components/<cat>/` instead. Blocks have no `index.mdx` so are unaffected; every category that gets symlinks is an item category that moves.

**Files:**
- Modify: `packages/registry/scripts/generate.ts:9`
- Modify: `packages/registry/scripts/generate.ts:309-335` (the `writeDocSymlinks` function)
- Modify: `packages/registry/scripts/generate.ts:343` (call site in `main`)

- [ ] **Step 1: Rename the target-dir constant**

Replace line 9:

```ts
const DOCS_CONTENT_DIR = path.resolve(ROOT, '../../apps/docs/content/docs');
```

with:

```ts
const COMPONENTS_CONTENT_DIR = path.resolve(ROOT, '../../apps/docs/content/components');
```

- [ ] **Step 2: Update the symlink-writing function**

Replace the whole function (currently `writeDocSymlinks`, lines 309-335):

```ts
const writeComponentSymlinks = (items: ScannedItem[]): void => {
  const symlinksByCategory = new Map<string, string[]>();

  for (const item of items) {
    if (!item.hasMdx) continue;
    const symlinkPath = path.join(COMPONENTS_CONTENT_DIR, item.category, `${item.folderName}.mdx`);
    const sourceMdx = path.join(item.itemDir, 'index.mdx');
    const relTarget = path.relative(path.dirname(symlinkPath), sourceMdx);
    fs.mkdirSync(path.dirname(symlinkPath), { recursive: true });
    try {
      fs.unlinkSync(symlinkPath);
    } catch {
      // file did not exist
    }
    fs.symlinkSync(relTarget, symlinkPath);

    const existing = symlinksByCategory.get(item.category) ?? [];
    existing.push(`${item.folderName}.mdx`);
    symlinksByCategory.set(item.category, existing);
  }

  for (const [category, filenames] of symlinksByCategory) {
    const gitignorePath = path.join(COMPONENTS_CONTENT_DIR, category, '.gitignore');
    const content = `# Auto-generated symlinks — do not commit (created by packages/registry/scripts/generate.ts)\n${filenames.sort().join('\n')}\n`;
    fs.writeFileSync(gitignorePath, content);
  }
};
```

- [ ] **Step 3: Update the call site in `main`**

Replace line 343:

```ts
  writeDocSymlinks(items);
```

with:

```ts
  writeComponentSymlinks(items);
```

- [ ] **Step 4: Regenerate**

Run: `bun registry:generate`
Expected: prints `[generate] N items processed` (N ≈ 40).

- [ ] **Step 5: Assert symlinks landed in the new location**

Run:

```bash
ls apps/docs/content/components/components/*.mdx apps/docs/content/components/react-hook-form/*.mdx >/dev/null && echo "OK: components symlinks present"
test -L apps/docs/content/components/components/copy-button.mdx && echo "OK: is a symlink"
cat apps/docs/content/components/react-hook-form/.gitignore | head -3
```

Expected: both `OK:` lines print; the `.gitignore` lists `*.mdx` filenames.

- [ ] **Step 6: Commit**

```bash
git add packages/registry/scripts/generate.ts apps/docs/content/components
git commit -m "refactor(registry): emit item doc-symlinks under content/components"
```

> Note: the old `content/docs/<cat>/` symlinks still exist on disk (orphaned but functional) and are cleaned up in Task 8. The build stays green until then.

---

## Task 2: Add the `components` collection and source loader

**Files:**
- Modify: `apps/docs/source.config.ts:25-28` (after the `blocks` collection)
- Modify: `apps/docs/src/lib/source.ts`

- [ ] **Step 1: Declare the collection**

In `apps/docs/source.config.ts`, after the `blocks` export, add:

```ts
export const components = defineDocs({
  dir: './content/components',
  ...defaultOptions,
});
```

- [ ] **Step 2: Add the loader and update aggregates in `source.ts`**

In `apps/docs/src/lib/source.ts`, change the import on line 1:

```ts
import { blocks, components, docs } from 'fumadocs-mdx:collections/server';
```

After the `blocksSource` export (line 23), add:

```ts
export const componentsSource = loader({
  baseUrl: '/components',
  source: components.toFumadocsSource(),
  icon,
});
```

Replace `allPages` (line 25):

```ts
export const allPages = () => [
  ...docsSource.getPages(),
  ...blocksSource.getPages(),
  ...componentsSource.getPages(),
];
```

Update the two type unions. In `getPageImage` (line 28) and `getLLMText` (line 39), replace `InferPageType<typeof docsSource | typeof blocksSource>` with:

```ts
InferPageType<typeof docsSource | typeof blocksSource | typeof componentsSource>
```

And widen the `getPageImage` `docsType` parameter (line 29) from `'docs' | 'blocks'` to:

```ts
  docsType: 'docs' | 'blocks' | 'components',
```

- [ ] **Step 3: Regenerate fumadocs types**

Run: `cd apps/docs && bunx fumadocs-mdx && cd ../..`
Expected: regenerates `.source/`; no error.

- [ ] **Step 4: Type-check**

Run: `cd apps/docs && bunx tsc --noEmit; cd ../..`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/docs/source.config.ts apps/docs/src/lib/source.ts
git commit -m "feat(docs): add components fumadocs collection and source loader"
```

---

## Task 3: Create the `<LazyPreview>` component

A client component that mounts the existing `Preview` only when scrolled into view, so heavy previews are not all mounted at once.

**Files:**
- Create: `apps/docs/src/components/lazy-preview.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client';

import * as React from 'react';
import { Preview } from '@/components/item-preview';

export interface LazyPreviewProps {
  registryName: string;
  className?: string;
}

export function LazyPreview({ registryName, className }: LazyPreviewProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={className}>
      {visible ? <Preview registryName={registryName} /> : null}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd apps/docs && bunx tsc --noEmit; cd ../..`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/components/lazy-preview.tsx
git commit -m "feat(docs): add LazyPreview viewport-gated preview component"
```

---

## Task 4: Create the `<ComponentsGallery>` component

Groups item pages by category and renders a grid of preview cards per category.

**Files:**
- Create: `apps/docs/src/components/components-gallery.tsx`

- [ ] **Step 1: Write the component**

```tsx
import Link from 'next/link';
import { LazyPreview } from '@/components/lazy-preview';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { componentsSource } from '@/lib/source';

const CATEGORY_ORDER = ['components', 'react-hook-form', 'tanstack-form', 'tanstack-query'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  components: 'Components',
  'react-hook-form': 'React Hook Form',
  'tanstack-form': 'Tanstack Form',
  'tanstack-query': 'Tanstack Query',
};

export function ComponentsGallery() {
  const pages = componentsSource.getPages().filter((page) => page.data.registryName);

  const byCategory = new Map<string, typeof pages>();
  for (const page of pages) {
    const category = page.slugs[0];
    if (!category) continue;
    const list = byCategory.get(category) ?? [];
    list.push(page);
    byCategory.set(category, list);
  }

  return (
    <div className='space-y-12'>
      {CATEGORY_ORDER.filter((category) => byCategory.has(category)).map((category) => (
        <section key={category} className='space-y-6'>
          <h2 className='font-mono text-2xl font-bold'>{CATEGORY_LABELS[category]}</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {byCategory.get(category)?.map((page) => (
              <Link href={page.url} key={page.url} className='no-underline'>
                <Card className='overflow-hidden transition-all hover:bg-accent hover:shadow-2xl'>
                  <div className='pointer-events-none flex h-40 items-center justify-center overflow-hidden border-b border-border'>
                    <LazyPreview registryName={`${page.data.registryName}.example`} className='w-full' />
                  </div>
                  <CardHeader>
                    <CardTitle>{page.data.title}</CardTitle>
                    <CardDescription className='line-clamp-2'>{page.data.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd apps/docs && bunx tsc --noEmit; cd ../..`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/components/components-gallery.tsx
git commit -m "feat(docs): add ComponentsGallery grouped preview grid"
```

---

## Task 5: Add the `/components` landing content (meta + index)

**Files:**
- Create: `apps/docs/content/components/meta.json`
- Create: `apps/docs/content/components/index.mdx`

- [ ] **Step 1: Write the collection meta (sidebar nav)**

`apps/docs/content/components/meta.json`:

```json
{
  "title": "Components",
  "description": "All shuip items: components, form fields and utilities.",
  "root": true,
  "pages": [
    "index",
    "---COMPONENTS---",
    "...components",
    "---REACT HOOK FORM---",
    "...react-hook-form",
    "---TANSTACK QUERY---",
    "...tanstack-query",
    "---TANSTACK FORM---",
    "...tanstack-form/overview",
    "...tanstack-form"
  ]
}
```

- [ ] **Step 2: Write the landing page**

`apps/docs/content/components/index.mdx`:

```mdx
---
title: Components
description: Browse every shuip component with a live preview.
---

import { ComponentsGallery } from '@/components/components-gallery';

<ComponentsGallery />
```

- [ ] **Step 3: Regenerate fumadocs types and type-check**

Run: `cd apps/docs && bunx fumadocs-mdx && bunx tsc --noEmit; cd ../..`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/content/components/meta.json apps/docs/content/components/index.mdx
git commit -m "feat(docs): add /components landing page and sidebar meta"
```

---

## Task 6: Wire `components` into DocsPageBase and create the app routes

**Files:**
- Modify: `apps/docs/src/components/docs-page-base.tsx`
- Create: `apps/docs/src/app/components/layout.tsx`
- Create: `apps/docs/src/app/components/not-found.tsx`
- Create: `apps/docs/src/app/components/[[...slug]]/page.tsx`
- Create: `apps/docs/src/app/components/llms.mdx/[[...slug]]/route.ts`

- [ ] **Step 1: Extend `docs-page-base.tsx` to know about `components`**

Change the import on line 7:

```ts
import { blocksSource, componentsSource, docsSource, getPageImage } from '@/lib/source';
```

Change the type alias (line 10):

```ts
type DocsPageType = 'docs' | 'blocks' | 'components';
```

In `DocsPageBase`, replace line 20:

```ts
  const source = { docs: docsSource, blocks: blocksSource, components: componentsSource }[docsType];
```

In `generateDocsPageMetadata`, replace line 55:

```ts
  const source = { docs: docsSource, blocks: blocksSource, components: componentsSource }[docsType];
```

- [ ] **Step 2: Create the layout**

`apps/docs/src/app/components/layout.tsx`:

```tsx
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { componentsSource } from '@/lib/source';

export default function Layout({ children }: LayoutProps<'/components'>) {
  const base = baseOptions();
  return (
    <DocsLayout {...base} nav={{ ...base.nav, mode: 'top' }} tree={componentsSource.pageTree}>
      {children}
    </DocsLayout>
  );
}
```

- [ ] **Step 3: Create the not-found page**

`apps/docs/src/app/components/not-found.tsx`:

```tsx
import { DocsPage } from 'fumadocs-ui/page';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <DocsPage full>
      <div className='flex min-h-[60vh] w-full flex-col items-center justify-center px-4 text-center'>
        <div className='space-y-6'>
          <div className='space-y-2'>
            <h1 className='font-mono text-6xl font-bold text-foreground'>404</h1>
            <h2 className='text-2xl font-semibold text-foreground'>Page Not Found</h2>
            <p className='text-muted-foreground'>The page you're looking for doesn't exist in the components section.</p>
          </div>
          <Button asChild variant='default' size='lg'>
            <Link href='/components'>Go back to Components</Link>
          </Button>
        </div>
      </div>
    </DocsPage>
  );
}
```

- [ ] **Step 4: Create the page route**

`apps/docs/src/app/components/[[...slug]]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { DocsPageBase, generateDocsPageMetadata } from '@/components/docs-page-base';
import { componentsSource } from '@/lib/source';

export default async function ComponentsPage(props: PageProps<'/components/[[...slug]]'>) {
  return <DocsPageBase<'components'> docsType='components' props={props} />;
}

export async function generateStaticParams() {
  return componentsSource.generateParams();
}

export async function generateMetadata(props: PageProps<'/components/[[...slug]]'>): Promise<Metadata> {
  return generateDocsPageMetadata('components', props);
}
```

- [ ] **Step 5: Create the llms.mdx route**

`apps/docs/src/app/components/llms.mdx/[[...slug]]/route.ts`:

```ts
import { notFound } from 'next/navigation';
import { componentsSource, getLLMText } from '@/lib/source';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/components/llms.mdx/[[...slug]]'>) {
  const { slug } = await params;
  const page = componentsSource.getPage(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}

export async function generateStaticParams() {
  return componentsSource.generateParams();
}
```

- [ ] **Step 6: Type-check**

Run: `cd apps/docs && bunx tsc --noEmit; cd ../..`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/src/components/docs-page-base.tsx apps/docs/src/app/components
git commit -m "feat(docs): add /components app routes and DocsPageBase wiring"
```

---

## Task 7: Create the `/og/components` image route

**Files:**
- Create: `apps/docs/src/app/og/components/[...slug]/route.tsx`

- [ ] **Step 1: Write the route**

`apps/docs/src/app/og/components/[...slug]/route.tsx`:

```tsx
/** biome-ignore-all lint/performance/noImgElement: false positive */

import { generate as DefaultImage } from 'fumadocs-ui/og';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { componentsSource, getPageImage } from '@/lib/source';

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<'/og/components/[...slug]'>) {
  const { slug } = await params;
  const page = componentsSource.getPage(slug);
  if (!page) notFound();

  const { title, description } = page.data;

  const truncatedDescription =
    description && description.length > 120 ? `${description.slice(0, 120)}...` : description;

  return new ImageResponse(
    <DefaultImage
      site='shuip'
      title={<span style={{ color: 'rgb(5, 105, 255)' }}>{title}</span>}
      description={truncatedDescription}
      icon={<img src={getPageImage(page, 'components').url} alt={title} width={64} height={64} />}
      primaryColor='rgba(5, 105, 255, 0.15)'
      primaryTextColor='white'
    />,
    {
      width: 1200,
      height: 630,
    },
  );
}

export function generateStaticParams() {
  return componentsSource.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page, 'components').segments,
  }));
}
```

- [ ] **Step 2: Type-check**

Run: `cd apps/docs && bunx tsc --noEmit; cd ../..`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/app/og/components
git commit -m "feat(docs): add /og/components image route"
```

---

## Task 8: Cut over `/docs` — remove item categories, move overview, fix cross-links

After this task the old `/docs/<cat>/*` URLs are gone and only guides remain under `/docs`.

**Files:**
- Move: `apps/docs/content/docs/tanstack-form/overview.mdx` → `apps/docs/content/components/tanstack-form/overview.mdx`
- Delete: `apps/docs/content/docs/{components,react-hook-form,tanstack-form,tanstack-query}/` (stale symlinks + tracked `.gitignore`)
- Modify: `apps/docs/content/docs/meta.json`
- Modify: 13 `index.mdx` files under `packages/registry/items/` (cross-links)

- [ ] **Step 1: Move the hand-written overview file**

```bash
git mv apps/docs/content/docs/tanstack-form/overview.mdx apps/docs/content/components/tanstack-form/overview.mdx
```

- [ ] **Step 2: Remove the stale item-category dirs from `content/docs`**

```bash
git rm -r --cached apps/docs/content/docs/components/.gitignore apps/docs/content/docs/react-hook-form/.gitignore apps/docs/content/docs/tanstack-form/.gitignore apps/docs/content/docs/tanstack-query/.gitignore
rm -rf apps/docs/content/docs/components apps/docs/content/docs/react-hook-form apps/docs/content/docs/tanstack-form apps/docs/content/docs/tanstack-query
```

Expected: the four `.gitignore` files are unstaged-removed and the directories (incl. their gitignored symlinks) are deleted from disk.

- [ ] **Step 3: Trim `content/docs/meta.json` to guides only**

Replace the whole file with:

```json
{
  "title": "Documentation",
  "description": "Documentation for the project",
  "root": true,
  "pages": ["index", "configuration", "installation", "contribution", "changelog"]
}
```

- [ ] **Step 4: Rewrite item cross-links from `/docs/<cat>/` to `/components/<cat>/`**

These are pure string substitutions inside MDX prose (verified by the grep in Step 5):

```bash
rg -l -e '/docs/(tanstack-form|react-hook-form|tanstack-query|components)/' packages/registry/items \
  | xargs perl -pi -e 's{/docs/(tanstack-form|react-hook-form|tanstack-query|components)/}{/components/$1/}g'
```

- [ ] **Step 5: Verify no stale links remain**

Run:

```bash
rg -n -e '/docs/(tanstack-form|react-hook-form|tanstack-query|components)/' packages/registry/items apps/docs/content && echo "STALE LINKS FOUND" || echo "OK: no stale item links"
```

Expected: `OK: no stale item links`.

- [ ] **Step 6: Regenerate, type-check**

Run: `cd apps/docs && bunx fumadocs-mdx && bunx tsc --noEmit; cd ../..`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/docs/content/docs apps/docs/content/components/tanstack-form/overview.mdx packages/registry/items
git commit -m "refactor(docs): move items out of /docs into /components and fix cross-links"
```

---

## Task 9: Rework `<BlocksList>` into a single-column preview list

**Files:**
- Modify: `apps/docs/src/components/blocks-list.tsx`

- [ ] **Step 1: Replace the component**

```tsx
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { LazyPreview } from '@/components/lazy-preview';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { blocksSource } from '@/lib/source';

export function BlocksList() {
  const blocksPages = blocksSource.getPages().filter((page) => page.data.registryName);

  return (
    <div className='flex flex-col gap-6'>
      {blocksPages.map((page) => (
        <Link
          href={page.url}
          key={page.url}
          className='no-underline hover:**:data-arrow:translate-x-1 hover:**:data-arrow:-translate-y-1'
        >
          <Card className='overflow-hidden transition-all hover:bg-accent hover:shadow-2xl'>
            <CardHeader className='relative'>
              <CardTitle>{page.data.title}</CardTitle>
              <CardDescription className='line-clamp-3'>{page.data.description}</CardDescription>
              <ArrowUpRight data-arrow className='absolute top-4 right-4 size-4 transition' />
            </CardHeader>
            <div className='pointer-events-none h-80 overflow-hidden border-t border-border'>
              <LazyPreview registryName={`${page.data.registryName}.example`} className='h-full' />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd apps/docs && bunx tsc --noEmit; cd ../..`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/components/blocks-list.tsx
git commit -m "feat(docs): show lazy previews in single-column blocks list"
```

---

## Task 10: Add the `Components` navigation entry and home link

**Files:**
- Modify: `apps/docs/src/lib/layout.shared.tsx:24-34`
- Modify: `apps/docs/src/app/(home)/page.tsx:18-20`

- [ ] **Step 1: Add the nav link**

In `apps/docs/src/lib/layout.shared.tsx`, inside the `links` array, between the `Documentation` entry and the `Blocks` entry, insert:

```tsx
      {
        text: 'Components',
        url: '/components',
        on: 'nav',
      },
```

- [ ] **Step 2: Add a home-page link**

In `apps/docs/src/app/(home)/page.tsx`, after the `/docs` anchor (line 18-20), add:

```tsx
        <a href='/components' className='hover:underline underline-offset-4'>
          /components
        </a>
```

- [ ] **Step 3: Type-check**

Run: `cd apps/docs && bunx tsc --noEmit; cd ../..`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src/lib/layout.shared.tsx 'apps/docs/src/app/(home)/page.tsx'
git commit -m "feat(docs): add Components to nav and home links"
```

---

## Task 11: Full build and manual verification

**Files:** none (verification only)

- [ ] **Step 1: Lint/format gate**

Run: `bun check`
Expected: Biome reports no remaining errors (auto-fixes applied).

- [ ] **Step 2: Full build**

Run: `bun build:docs`
Expected: build succeeds (chains `registry:generate` → `registry:build` → `next build`); no type errors, all routes generated including `/components` and `/og/components`.

- [ ] **Step 3: Manual smoke test**

Run: `bun dev:docs` and check in the browser:

- [ ] `/components` — sections grouped (Components, React Hook Form, Tanstack Query, Tanstack Form), each a grid of cards; previews mount as you scroll (network shows lazy chunk loads), not all at once.
- [ ] Clicking a card navigates to e.g. `/components/components/copy-button` and the item page renders.
- [ ] `/blocks` — single-column full-width cards, each showing a preview below title/description.
- [ ] `/docs` — sidebar shows only guides (index, configuration, installation, contribution, changelog); no item categories.
- [ ] cmd+k search returns item results whose URLs start with `/components/...`.
- [ ] A tanstack-form item page still links correctly to `/components/tanstack-form/form-context`.

- [ ] **Step 4: Commit any formatting fixups**

```bash
git status
git add apps/docs packages/registry
git commit -m "chore(docs): formatting after components routing split" || echo "nothing to commit"
```

---

## Self-Review Notes

- **Spec coverage:** routing split (Tasks 1, 2, 6, 8, 10), generator retarget (Task 1), content migration incl. overview + cross-links (Task 8), source/config wiring (Task 2), app routes incl. og/llms (Tasks 6, 7), gallery grouped (Tasks 4, 5), lazy previews (Task 3), `/blocks` single-column (Task 9), nav/home (Task 10), verification (Task 11). Search + `llms-full.txt` covered via `allPages` (Task 2). No redirects (out of scope, confirmed).
- **Type consistency:** `componentsSource`, `ComponentsGallery`, `LazyPreview`, `DocsPageType = 'docs' | 'blocks' | 'components'`, and `getPageImage(page, 'components')` are used identically across tasks.
- **Build-green ordering:** old `/docs` item symlinks remain functional through Tasks 1-7; the cutover (Task 8) removes them and trims meta in one commit.
