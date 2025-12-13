# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ThoughtLite** is an Astro-based blog theme focused on content creation with extensive i18n support, built with Svelte 5 and Tailwind CSS v4. This is a fork/customization of the [astro-theme-thought-lite](https://github.com/tuyuritio/astro-theme-thought-lite) theme.

**Stack**: Astro 5.16+ • Svelte 5.46+ • Tailwind CSS 4.1+ • TypeScript 5.9+

## Essential Commands

```bash
# Development
pnpm dev              # Start dev server at localhost:4321
pnpm build            # Build for production
pnpm preview          # Preview production build locally
pnpm check            # Run Astro type checking

# Content Management
pnpm new              # Interactive CLI to create new content (uses tsx + yaml loader)

# Code Quality
pnpm format           # Format code with Biome
pnpm lint             # Lint code with Biome

# Utilities
pnpm count            # Count total lines added/removed via git log
```

**Important**: This project enforces `pnpm` only (via `only-allow pnpm` preinstall hook). Do not use npm or yarn.

## Architecture Overview

### Content Collections Structure

Four distinct content types managed via Astro Content Collections:

- **`src/content/note/`** - Main blog articles with series/tags/TOC support
- **`src/content/jotting/`** - Shorter posts/micro-blog entries
- **`src/content/preface/`** - Homepage introductory content
- **`src/content/information/`** - Static pages (about, policy, etc.)

Each collection supports multilingual content via article directories, where each article has language-specific files (`en.md`, `zh-cn.md`, `ja.md`). Files starting with underscore (`_*.md`) are excluded from builds.

**Schema Fields** (note/jotting):
```typescript
{
  title: string,
  timestamp: Date,
  series?: string,        // Only for notes
  tags?: string[],
  description?: string,
  toc: boolean,          // Table of contents toggle
  sensitive: boolean,     // Requires user confirmation
  draft: boolean,
  top: number            // Pin priority
}
```

### i18n Implementation

**File Organization**: Content organized by article directories with language-specific files (`/post/en.md`, `/post/zh-cn.md`, `/post/ja.md`)

**URL Strategy**:
- Default locale (zh-cn) URLs have no prefix: `/note/post`
- Other locales prefixed: `/en/note/post`, `/ja/note/post`

**Translation System** (`src/i18n/`):
- YAML-based translation files organized by namespace
- Custom `i18nit()` function with dot-notation access: `t("notification.reply.title")`
- Parameter substitution via `{paramName}` placeholders
- Type-safe namespaces: `index`, `script`, `linkroll`

**Monolocale Mode**: Set `monolocale: true` in `site.config.ts` to disable i18n folder structure.

### Routing Patterns

Dynamic routes using Astro's `[...param]` syntax:

```
/[...locale]/                           → Homepage
/[...locale]/note/                      → Note listing (with filtering)
/[...locale]/note/[...id]/              → Individual note
/[...locale]/jotting/                   → Jotting listing
/[...locale]/jotting/[...id]/           → Individual jotting
/[...locale]/about|policy|preface       → Static pages
/feed.xml                               → Atom feed
/[...locale]/note/[...id]/graph.png     → OG image generation
```

### Markdown Processing Pipeline

**Critical Configuration** (`astro.config.ts`):

The theme employs 15+ remark plugins and 6 rehype plugins for rich markdown support:

**Custom Syntax Extensions**:
- `!!spoiler text!!` → Spoiler blocks
- `*[ABBR]: Definition` → Abbreviations
- `{#id .class key="value"}` → Inline HTML attributes
- `::ruby[base]{rt=pronunciation}` → CJK ruby annotations
- GitHub-style blockquote alerts (`::: note`, `::: warning`)

**Notable Plugins**:
- `remark-cjk-friendly` - Optimized CJK line breaking
- `remark-extended-table` - Advanced table features with colspan
- `rehype-figure` - Converts images to semantic `<figure>` with captions
- `rehype-sectionize` - Groups headings into `<section>` elements
- Custom `reading` plugin - Injects word count into frontmatter

**Code Highlighting**: Shiki with custom copy-button transformer (clipboard icon → checkmark feedback)

### Component Architecture

**Svelte 5 Components** (using runes):
- Use `$state()`, `$derived()`, `$effect()` APIs
- Components with transitions/animations require proper hydration setup
- Client directives: Prefer `client:load` (SSR + hydration) over `client:only`

**Key Components**:
- **Note/Jotting.svelte** - Complex filtering UI with URL state management
- **Heatmap.svelte** - GitHub-style contribution calendar
- **Sensitive.svelte** - Content warning gate with transition effects
- **Icon.svelte** - Iconify wrapper requiring `` `${string}--${string}` `` icon names

**Layouts**:
- **Base.astro** - Root HTML with meta tags, font preloading
- **App.astro** - Theme wrapper
- **Footer.astro** - Dynamic CC license rendering, word count stats

### Styling System

**Tailwind CSS v4** with Vite integration (`@tailwindcss/vite`)

**Theme Variables** (`src/styles/global.css`):
```css
--color-primary, --color-secondary, --color-remark
--color-weak, --color-background, --color-block
--font-serif, --font-mono, --font-cursive
```

Auto dark mode via `@media (prefers-color-scheme: dark)`.

**Markdown Styling**: Dedicated `src/styles/markdown.css` for rendered content.

### Utility Functions

**`src/utils/time.ts`** - Timezone-aware date handling (Luxon-based):
```typescript
Time(date)                    // Default format
Time.date.locale(date, locale) // Localized date
Time.addDays(date, n)         // Date arithmetic
Time.diffDays(start, end)     // Calculate difference
Time.weekday(date)            // Get weekday (timezone-aware)
```

**Environment Variable**: `PUBLIC_TIMEZONE` sets default timezone (e.g., "Asia/Shanghai")

### Configuration Files

**`site.config.ts`** - Main configuration:
```typescript
{
  title: string,
  description: string,
  author: { name: string, link?: string },
  copyright: { type: CCLicense, year: number },
  i18n: { locales: string[], defaultLocale: string },
  latest: "*" | ("note" | "jotting")[],  // Homepage content
  prologue?: string,
  timezone?: string
}
```

**`.env`** - Environment variables:
```
PUBLIC_TIMEZONE=Asia/Shanghai
```

**`astro.config.ts`** - Build configuration:
- Site URL and i18n routing
- Markdown plugin chain
- Vite configuration
- Integrations (Svelte, MDX, Sitemap, Swup)

## Critical Known Issues

### Svelte 5 Hydration in Development

**Problem**: Svelte 5 components with transitions may fail hydration in dev mode (`pnpm dev`) but work in production (`pnpm build`).

**Root Cause**: Vite's dependency pre-bundling conflicts with Svelte 5's reactive system.

**Solution** (already implemented in `astro.config.ts`):

```typescript
export default defineConfig({
  vite: {
    optimizeDeps: {
      exclude: ["svelte"]  // Prevent Vite pre-bundling
    },
    ssr: {
      noExternal: ["svelte"]  // Bundle Svelte in SSR
    }
  },
  integrations: [
    svelte({
      compilerOptions: {
        hydratable: true,     // Enable hydration support
        css: "injected"       // Inject CSS via JS
      }
    })
  ]
});
```

**Cache Clearing**: After configuration changes, always clear caches:
```bash
rm -rf node_modules/.vite node_modules/.astro .astro
```

**Reference**: See `docs/svelte5-hydration-fix.md` for detailed analysis.

### Type Safety for Icons

Icon names must match `` `${string}--${string}` `` pattern:

```typescript
// ✅ Correct
const icon = "lucide--calendar" as const;

// ❌ Wrong - triggers TS error
const icon = "lucide--calendar";  // Type 'string' not assignable
```

When defining icon mappings, use `as const` assertion:
```typescript
const types = {
  note: { icon: "lucide--file-text" as const }
};
```

### Content Collection Filtering

When extracting unique values from optional arrays, use type guards:

```typescript
// ✅ Correct - with type guard
const tags = Array.from(
  new Set(notes.flatMap(note => note.data.tags)
    .filter((tag): tag is string => Boolean(tag)))
).sort();

// ❌ Wrong - includes undefined
const tags = notes.flatMap(note => note.data.tags).filter(Boolean);
```

## Working with Content

### Creating New Content

Use the interactive CLI:
```bash
pnpm new
```

This launches a prompts-based wizard (via `@clack/prompts`) to create properly formatted content files with frontmatter.

**Manual Creation**: Files must include YAML frontmatter matching the collection schema (see `src/content.config.ts`).

### Content Location

For multilingual setup:
```
src/content/note/my-post/en.md
src/content/note/my-post/zh-cn.md
src/content/note/my-post/ja.md
```

Nested categories are supported:
```
src/content/note/category/my-post/en.md
src/content/note/category/my-post/zh-cn.md
src/content/note/category/my-post/ja.md
```

For monolingual setup (when `monolocale: true`):
```
src/content/note/my-post.md
```

**Special Collections**:

- **preface**: Uses timestamp as directory name
  ```
  src/content/preface/2025-12-14-01-07-22/zh-cn.md
  ```

- **information**: Contains static pages (introduction, linkroll, policy) and data files (chronicle)
  ```
  src/content/information/introduction/zh-cn.md
  src/content/information/chronicle/zh-cn.yaml
  ```

When using `getEntry()` with these collections, use the format `article/locale`:
```typescript
await getEntry("information", "introduction/zh-cn")
await getEntry("information", "chronicle/zh-cn")
```

### Draft Management

Two approaches:
1. Set `draft: true` in frontmatter (excluded from builds)
2. Prefix filename with underscore: `_draft-post.md` (excluded by glob pattern)

## Development Workflow

### Git Hooks

Pre-commit hook auto-formats staged files via Biome:
```json
"lint-staged": {
  "*.{js,ts,json,jsonc,css,svelte,astro}": [
    "biome check --write --no-errors-on-unmatched --files-ignore-unknown=true"
  ]
}
```

Managed by Husky (`pnpm prepare` installs hooks).

### Type Checking

Run before commits:
```bash
pnpm check
```

Astro's type checking includes:
- Content collection schemas
- Frontmatter validation
- Component prop types
- TypeScript errors across all files

### Performance Considerations

- **Font Subsetting**: OG image generation uses dynamic Google Fonts subsetting (only required characters)
- **Image Optimization**: Medium Zoom handles lazy loading
- **Code Splitting**: Swup manages page transitions (0.15s fade)
- **Static Generation**: Heavy use of SSG, minimal client-side JS

## Special Features

### OG Image Generation

Dynamic social sharing images via Satori + Sharp:

```
/[...locale]/note/[...id]/graph.png
```

**Implementation** (`src/graph/content.ts`):
- Fetches Noto Serif fonts from Google (locale-specific)
- Renders SVG using Satori
- Converts to PNG with Sharp
- Shows: content type, title, series, tags, author

**Customization**: Modify `src/graph/content.ts` template.

### Feed Generation

Atom feed at `/feed.xml` with:
- Configurable sections (`config.latest`)
- Locale-aware URLs
- XSLT stylesheet for browser viewing (`feed.xsl.ts`)

### Statistics Tracking

Footer displays total word count across all published content:
- Calculated via `render(entry).remarkPluginFrontmatter.words`
- Powered by `reading-time` library

## Syncing Upstream Updates

This is a fork of the original theme. To merge upstream changes:

```bash
git remote add theme https://github.com/tuyuritio/astro-theme-thought-lite.git
git fetch theme
git merge theme/main --allow-unrelated-histories  # First time only
pnpm install
```

**Caution**: Review merge conflicts carefully, especially in:
- `astro.config.ts` (Svelte 5 hydration fixes)
- `site.config.ts` (personal configuration)
- Content files (`src/content/`)

## Additional Resources

- **Theme Documentation**: Content files in `src/content/note/en/` (configuration.md, internationalization.md, content.md)
- **Hydration Fix Analysis**: `docs/svelte5-hydration-fix.md`
- **Original Repository**: https://github.com/tuyuritio/astro-theme-thought-lite
- **Live Demo**: https://thought-lite.vercel.app/

## License

GPL-3.0 - Original copyright notice must be retained when modifying/distributing.
