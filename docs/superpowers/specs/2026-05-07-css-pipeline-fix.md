# Rapport — Fix pipeline CSS turborepo

**Date :** 2026-05-07
**Branche :** `refactor/turborepo`
**Contexte :** Après migration vers turborepo, deux régressions visuelles : (1) le Select dropdown rendait sans styles (apparence cassée, icône orange brute Radix), (2) le background navy en dark mode avait disparu sur les pages docs.

## Causes racines

### 1. `@source` cassé dans `packages/ui/src/styles/base.css`

Path écrit : `@source "../../components"`
Résolu depuis `packages/ui/src/styles/base.css` :
- `..` → `packages/ui/src/`
- `..` → `packages/ui/`
- `/components` → `packages/ui/components` ← **n'existe pas**

Le vrai dossier est `packages/ui/src/components/`. Conséquence : Tailwind v4 (ancré sur `apps/docs` parce que c'est de là que tourne PostCSS) ne scannait pas les primitives shadcn dans `packages/ui/src/components/ui/`. Toutes les utilities propres à ces composants (`bg-popover`, `text-popover-foreground`, variantes `data-[state=open]:`, animations `animate-in`, etc.) n'étaient pas générées.

Avant le refactor, le CSS entry vivait dans `packages/ui/src/styles/globals.css` et l'auto-détection Tailwind couvrait `packages/ui/src/` automatiquement. Déplacer le CSS entry vers `apps/docs` a sorti `packages/ui/src/components/` du périmètre auto-scanné — d'où la nécessité du `@source` explicite.

### 2. Préset fumadocs incompatible avec le thème shadcn

`@import 'fumadocs-ui/css/neutral.css'` définit un thème indépendant via `--color-fd-*` (préfixées). Les couleurs shuip vivent en `--*` (non préfixées). Les deux systèmes ne se parlaient pas : les layouts fumadocs (`<DocsLayout>`, `<HomeLayout>`) peignaient `bg-fd-background` neutre par-dessus le `bg-background` shuip → le navy n'était plus visible où fumadocs prenait le contrôle.

### 3. `@theme inline` imbriqué dans `@layer base`

Fonctionnait par tolérance Tailwind v4. À sortir au top-level pour respecter le contrat documenté.

## Corrections appliquées

### `packages/ui/src/styles/base.css`

```diff
- @import 'tailwindcss';
  @import "tw-animate-css";
+
+ @source "../components/**/*.{ts,tsx}";
  @source "../../../registry/items/**/*.{ts,tsx}";
  @source "../../../../apps/docs/src/**/*.{ts,tsx}";
- @source "../../components";
```

`@theme inline { ... }` extrait du `@layer base { ... }` parent → top-level.

### `apps/docs/src/styles/globals.css`

```diff
+ @import 'tailwindcss';
+ @import 'fumadocs-ui/css/shadcn.css';
+ @import 'fumadocs-ui/css/preset.css';
  @import "@repo/ui/styles/base.css";
- @import 'fumadocs-ui/css/neutral.css';
- @import 'fumadocs-ui/css/preset.css';
```

`fumadocs-ui/css/shadcn.css` est le préset officiel qui mappe `--color-fd-*` → `var(--*)`. Fumadocs hérite ainsi automatiquement du thème shuip (clair et sombre).

## Architecture CSS post-fix

```
apps/docs/src/styles/globals.css       ← entry PostCSS
├── @import 'tailwindcss'              ← Tailwind v4 engine
├── @import 'fumadocs-ui/css/shadcn.css' ← bridge fd ↔ shadcn vars
├── @import 'fumadocs-ui/css/preset.css' ← styles internes fumadocs (auto-source dist/)
├── @import '@repo/ui/styles/base.css' ← variables shuip + sources cross-package
│   ├── @source ../components          ← packages/ui/src/components/**
│   ├── @source ../../../registry/items ← packages/registry/items/**
│   ├── @source ../../../../apps/docs/src ← apps/docs/src/**
│   ├── :root { --background, ... }
│   ├── .dark { --background, ... }
│   ├── @theme inline { --color-* }    ← top-level (génère utilities shadcn)
│   └── body { @apply bg-background text-foreground }
└── .h1-mdx, .table-trigger, ...       ← classes locales docs
```

## Vérifications de non-régression

Build prod (`bun run --cwd apps/docs next build`) :
- ✓ Compilation TypeScript propre (55s)
- ✓ 99 pages statiques générées
- ✓ `bg-popover{background-color:var(--popover)}` présent dans le CSS final
- ✓ Variantes `[data-state=open]`, `[data-state=closed]`, `[data-state=active]` générées
- ✓ `@keyframes enter`, `exit` (animations dropdown) générées
- ✓ Variables fumadocs `--color-fd-background`, `--color-fd-popover` etc présentes
- ✓ Variables shuip `--background: #d4dced` (light) / `#090d15` (dark navy) présentes
- ✓ Cascade body : `body{background-color:var(--color-fd-background)}` puis override `body{background-color:var(--background)}`

## Choses NON corrigées (volontairement)

1. **`tsc --noEmit` warning TS5101** sur `baseUrl` deprecated (TS 6.0). Pelavo avait retiré `ignoreDeprecations: "6.0"` volontairement. À rétablir uniquement si on veut un check TS propre.

2. **Mode dark par défaut.** L'`AppProvider` est en `defaultTheme: 'system'`. Si l'OS est en clair, on charge en clair. Pour forcer dark : changer `defaultTheme` ou retirer `enableSystem`. Choix UX, pas un bug.

3. **TS project references sans `composite: true`.** Le root `tsconfig.json` déclare des références mais aucun sous-tsconfig n'est composite. L'IDE résout via les paths sans s'appuyer sur `composite`. `tsc --build` ne passerait pas, mais on ne l'utilise pas (Next compile lui-même).

## Points d'attention pour le futur

- **Si on déplace à nouveau le CSS entry**, revérifier que tous les `@source` cross-package résolvent correctement (test concret : `ls` le path résolu).
- **Si on ajoute une 3ème app** dans `apps/`, il faudra ajouter un `@source "../../../../apps/<nouvelle-app>/src/**/*.{ts,tsx}"` dans `base.css`. Alternative plus robuste : déplacer les `@source` vers chaque app et ne garder dans `base.css` que ce qui touche aux packages partagés.
- **Tailwind v4 auto-content** ne franchit pas les frontières de packages dans un monorepo. Toujours déclarer `@source` explicite pour le cross-package.
- **fumadocs preset.css** v16 inclut son propre `@source 'fumadocs-ui/dist/**/*.js'`. Ne PAS le redéclarer manuellement (cause un double-scan).
