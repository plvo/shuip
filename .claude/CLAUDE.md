# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**shuip** is a React component library built on top of shadcn/ui for Next.js applications. It provides business-focused components that simplify common patterns (especially form fields). Components are distributed via a custom registry system that users install via the shadcn CLI.

## Development Commands

```bash
# Development
bun dev                    # Start Next.js dev server
bun build                  # Build with Turbopack
bun build:full             # Build + generate registry + build shadcn
bun build:analyze          # Build with bundle analysis

# Code quality
bun check                  # Biome check and auto-fix (runs on pre-commit)
bun format                 # Format code with Biome
bun lint                   # Lint code with Biome
bun check:unused           # Check for unused dependencies with knip

# Registry
bun run registry:generate  # Generate registry/__index__.ts from registry/ and examples/
bun run registry:build     # Build shadcn registry

# Clean
bun clean                  # Remove .next, node_modules, lock files
```

## Architecture

### Registry System (Core Concept)

This project uses a **custom component registry** that allows users to install components via `npx shadcn@latest add "https://shuip.plvo.dev/r/component-name"`.

**How it works:**
1. Components live in `registry/{ui,block,lib,actions}/` and `examples/`
2. `scripts/generate-registry.ts` scans these directories and generates `registry/__index__.ts`
3. The generated file creates a registry object with lazy-loaded components and their code
4. Next.js App Router serves these at `/r/[name]` routes for shadcn CLI consumption

**Key files:**
- `registry/ui/` - UI components (e.g., submit-button.tsx)
- `registry/block/` - Larger composition components
- `registry/lib/` - Utility functions
- `registry/actions/` - Server actions
- `examples/` - Usage examples
- `registry/__index__.ts` - Auto-generated, do not edit manually
- `registry.json` - Registry metadata

### Directory Structure

```
src/
├── app/              # Next.js App Router
│   ├── (docs)/       # Documentation pages (route group)
│   └── r/[name]/     # Registry API endpoints for shadcn CLI
├── components/
│   ├── ui/           # shadcn base components
│   │   └── shuip/    # shuip-specific components
│   ├── block/shuip/  # Block-level compositions
│   └── mdx/          # MDX documentation components
├── lib/
│   ├── utils.ts      # General utilities (cn helper, etc.)
│   └── shuip/        # shuip-specific utilities
├── providers/        # React context providers
└── styles/           # Global styles

content/              # MDX content for documentation
├── components/       # Component documentation
├── blocks/           # Block documentation
├── docs/             # General docs
└── react-hook-form/  # RHF-specific docs

registry/             # Source of truth for installable components
examples/             # Usage examples
```

### Path Aliases

- `@/*` → `src/*`
- `#/*` → `./*` (root)
- `@r/*` → `registry/*`

### MDX Configuration

The project uses `@next/mdx` with custom components defined in `src/mdx-components.tsx`. MDX files have `.md` and `.mdx` extensions enabled via `next.config.ts`.

Content is stored in `content/` and uses gray-matter frontmatter for metadata.

### Code Style (Biome)

- Biome is used for formatting and linting (not ESLint/Prettier)
- Single quotes, 2-space indent, 120 line width, trailing commas
- Auto-organizes imports
- `src/components/ui/` and `src/styles/` are excluded from linting
- Pre-commit hook runs `bun run format` automatically
- `noExplicitAny` is disabled (project allows `any`)

### Component Patterns

**shuip components** simplify shadcn patterns:
- React Hook Form fields: `InputField`, `SelectField`, `CheckboxField`, `RadioField` in `registry/ui/react-hook-form/`
- These wrap shadcn Form components to reduce boilerplate
- Use `register` prop pattern instead of verbose `FormField` render props
- See README.md for before/after examples

### Testing

No test runner is configured. If tests are needed, propose a setup first.

## Common Workflows

### Adding a New Component

1. Create component file in `registry/ui/` (or `registry/block/`)
2. Create corresponding documentation in `content/components/`
3. Run `bun run registry:generate` to update `registry/__index__.ts`
4. Run `bun run registry:build` to build shadcn registry
5. Test installation: `npx shadcn@latest add "https://shuip.plvo.dev/r/your-component"`

### Modifying Existing Components

1. Edit component in `registry/ui/` or `src/components/ui/shuip/`
2. Update documentation in `content/` if needed
3. Regenerate registry if in `registry/`: `bun run registry:generate`
4. Run `bun build:full` before deployment

### Working with Documentation

- Documentation is MDX in `content/`
- Custom MDX components in `src/components/mdx/` (e.g., `CodePreview`, `ItemInstallation`)
- Frontmatter is parsed with gray-matter
- TOC generation uses `mdast-util-toc`

## Important Notes

- **Never manually edit** `registry/__index__.ts` - it's auto-generated
- shadcn config is in `components.json` (New York style, RSC enabled)
- Production builds remove console logs (except `console.log`)
- The project uses React 19 and Next.js 15 App Router (RSC by default)
- Biome ignores `src/components/ui/**` (shadcn base components)
