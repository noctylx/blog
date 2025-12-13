# Blog Writing Guide

This guide provides a comprehensive reference for writing content in this Astro-based multilingual blog system.

## Content Sections Overview

### 📝 Note (文记)
**Purpose**: Core content section for in-depth articles

**Suitable for**:
- Well-structured, in-depth long-form articles
- Detailed book/movie reviews
- Research papers and studies
- Comprehensive experience sharing
- Systematic viewpoint discussions

**Characteristics**: Requires careful planning, focuses on depth and quality

### ✍️ Jotting (随笔)
**Purpose**: Lightweight instant recording space

**Suitable for**:
- Scattered thoughts
- Momentary inspiration
- Daily observations
- Brief insights

**Characteristics**: Free-form, short length

### 📄 Information (说明)
Contains four subsections:

**Preface (序文)**
- Displayed on the homepage
- Share life updates, reflections, site maintenance journey
- Supports historical version viewing

**Introduction (自述)**
- Showcase site features and value proposition
- Can include creation background, core positioning, future vision, personal resume

**Linkroll (连结)**
- Display recommended websites and resources
- Uses dedicated Linkroll component

**Policy (政策)**
- Privacy policy, terms of service, disclaimers, etc.

---

## Frontmatter Configuration Reference

### Basic Configuration

```yaml
---
title: Article Title                    # Required
timestamp: 2025-11-04 00:00:00+00:00   # Required, timestamp
tags: [Guide, Astro]                    # Tag array
description: Article description        # Article summary
---
```

### Advanced Configuration

```yaml
series: Astro                           # Series identifier
toc: true                               # Show table of contents
top: 1                                  # Pin priority (higher number = higher priority)
sensitive: true                         # Sensitive content flag (requires user confirmation)
draft: true                             # Draft status (excluded from builds)
```

---

## Markdown Features and Syntax

### 1. Image Insertion (Three Methods)

**Relative Path** (Recommended)
```markdown
![Image description](photo.png)
```
- Change article to directory structure: `image-preview/index.md`
- Place images in the same directory
- Astro automatically optimizes images
- Easy content organization

**Absolute Path** (Not Recommended)
```markdown
![Image description](/photo.png)
```
- Images stored in `/public` directory
- No Astro optimization
- Poor content management

**External Image Hosting**
```markdown
![Image description](https://image.host/photo.png)
```

### 2. Alert Boxes / Callouts

```markdown
> [!NOTE]
> This is a note box

> [!WARNING]
> This is a warning box

> [!TIP]
> This is a tip box
```

### 3. Footnotes

```markdown
Text content[^boat]

[^boat]: This is the footnote content
```

### 4. MDX Component Support

The system supports MDX format for importing Astro components:

```mdx
import Linkroll from "$components/Linkroll.astro";

<Linkroll locale={props.locale} links={links} />
```

---

## Linkroll Component Usage

File must be in `.mdx` format:

```mdx
import Linkroll from "$components/Linkroll.astro";

export const links = [
    {
        title: "Example Site",               # Required
        url: "https://example.com",          # Required
        type: "resources",                   # Required
        image: "https://example.com/favicon.ico",
        description: "This is an example site"
    }
];

<Linkroll locale={props.locale} links={links} />
```

**Available Type Classifications**:
- `resources` - Tools & Resources
- `community` - Organizations & Projects
- `insights` - Media & Inspiration
- `technology` - Technology & Development
- `expertise` - Professional & Academic
- `creative` - Design & Creative
- `lifestyle` - Life & Hobbies
- `general` - General & Others

---

## Configuration Files Reference

### `.env` Environment Variables
```bash
PUBLIC_TIMEZONE=Asia/Shanghai  # Default display timezone
```

### `site.config.ts` Site Configuration
```typescript
{
  title: "Site Title",
  prologue: "Homepage tagline\nSupports line breaks",
  author: {
    name: "Author Name",
    email: "email@example.com",
    link: "https://author.com"
  },
  description: "Site description",
  copyright: {
    type: "CC BY-NC-SA 4.0",
    year: "2024"
  },
  feed: {
    section: ["note", "jotting"],  // or "*" for all
    limit: 20
  },
  latest: {
    note: true,
    jotting: true
  },
  i18n: {
    locales: ["en", "zh-cn", "ja"],
    defaultLocale: "en"
  }
}
```

---

## Internationalization Configuration

### Multilingual Directory Structure
```
content/
├── note/
│   ├── my-post/
│   │   ├── en.md
│   │   ├── ja.md
│   │   └── zh-cn.md
```

### Monolingual Directory Structure
```
content/
├── note/
│   ├── common.md
│   └── image-preview/
```

### Adding a New Language

1. Create YAML translation files in `src/i18n/`
2. Register the language in `src/i18n/index.ts`
3. (Optional) Add font mapping in `src/layouts/App.astro`
4. Add to `i18n.locales` array in `site.config.ts`
5. Create corresponding content directories

---

## Icon and Logo Configuration

### Favicon
Use [RealFaviconGenerator](https://realfavicongenerator.net/) to generate:
- `favicon-96x96.png`
- `favicon.ico`
- `favicon.svg`

Place in `/public` directory

### Homepage Logo
Location: `src/icons/site-logo.svg`

Referenced in `src/pages/[...locale]/index.astro`:
```astro
import Logo from "$icons/site-logo.svg"
<Logo width={100} />
```

Recommend using `stroke="currentColor"` for dark/light theme compatibility

---

## Special Features

### Sensitive Content Marking
```yaml
---
title: Sensitive Content Example
sensitive: true
---
```
- Content will be blurred
- Requires user confirmation to view

### Article Pinning
```yaml
---
top: 1
---
```
Higher numbers appear first

### Article Series
```yaml
---
series: Astro
---
```
Articles with the same series are automatically linked

### Table of Contents Generation
```yaml
---
toc: true
---
```
Automatically generates article navigation

---

## Content Creation Workflow

### Using the CLI Tool

```bash
pnpm new
```

This launches an interactive wizard to create content with proper frontmatter.

### Manual Creation

For multilingual setup:
```
src/content/note/my-post/en.md
src/content/note/my-post/zh-cn.md
src/content/note/my-post/ja.md
```

Nested categories:
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

- **Preface**: Uses timestamp as directory name
  ```
  src/content/preface/2025-12-14-01-07-22/zh-cn.md
  ```

- **Information**: Contains static pages and data files
  ```
  src/content/information/introduction/zh-cn.md
  src/content/information/chronicle/zh-cn.yaml
  ```

---

## Draft Management

Two approaches:

1. Set `draft: true` in frontmatter (excluded from builds)
2. Prefix filename with underscore: `_draft-post.md` (excluded by glob pattern)

---

## Development Commands

```bash
# Development
pnpm dev              # Start dev server at localhost:4321
pnpm build            # Build for production
pnpm preview          # Preview production build

# Content Management
pnpm new              # Create new content interactively

# Quality
pnpm check            # Type checking
pnpm format           # Format with Biome
pnpm lint             # Lint with Biome
```

---

## Tips for AI-Assisted Writing

1. **Use the Information section as examples**: Check `src/content/information/` for reference implementations
2. **Follow existing patterns**: Maintain consistent frontmatter structure
3. **Test locally**: Always run `pnpm dev` to preview changes
4. **Use relative paths**: For better content organization and portability
5. **Leverage MDX**: For complex layouts, import and use Astro components

---

## Reference Examples

The `src/content/information/` directory contains working examples:
- `introduction/` - About page example
- `linkroll/` - Linkroll component usage
- `policy/` - Privacy policy example
- `chronicle/` - Timeline YAML structure

These files demonstrate best practices and can serve as templates for your own content.
