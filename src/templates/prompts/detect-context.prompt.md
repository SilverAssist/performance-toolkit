---
agent: agent
description: Detect and display project technology stack, framework, and architecture for contextual recommendations
---

# Detect Project Context

Analyze the project to understand its technology stack and architecture for performance optimization context.

## Prerequisites

- Access to project root directory
- `package.json` file present

## Steps

### 1. Analyze Package.json

**Step: Read and parse package.json**
1. Load `package.json` from project root
2. Extract project name and version
3. List all dependencies and devDependencies

### 2. Detect Framework

**Step: Identify main framework**

Check for these frameworks in order:
1. **Next.js**: `next` in dependencies
2. **Nuxt**: `nuxt` or `nuxt3` in dependencies
3. **Remix**: `@remix-run/react` in dependencies
4. **Gatsby**: `gatsby` in dependencies
5. **Astro**: `astro` in dependencies
6. **SvelteKit**: `@sveltejs/kit` in dependencies
7. **Angular**: `@angular/core` in dependencies
8. **Vue**: `vue` in dependencies (standalone)
9. **React**: `react` in dependencies (standalone)

### 3. Detect Framework Version & Features

**For Next.js:**
- Check version number (14 → 15 → 16)
- Determine router type:
  - Version >= 13.4: Likely App Router
  - Version < 13: Pages Router
- Check for Next.js 16 features:
  - `cacheComponents: true` in next.config
  - `reactCompiler: true` in next.config
  - `viewTransition: true` in next.config
  - `proxy.ts` file present
- Check for other features:
  - `next-auth` or `@auth/nextjs-provider`: Auth
  - `@next/font`: Font optimization
  - `next-intl` or `next-i18next`: i18n
  - `next-mdx-remote`: MDX support

**For Nuxt:**
- Check version (Nuxt 2 vs Nuxt 3)
- Check for modules in `nuxt.config`

### 4. Detect Supporting Technologies

**CSS Solution:**
- `tailwindcss`: Tailwind CSS
- `styled-components`: Styled Components
- `@emotion/react`: Emotion
- `sass` or `node-sass`: Sass/SCSS

**Build Tool:**
- `vite`: Vite
- `webpack`: Webpack
- `esbuild`: esbuild
- (Next.js 16 uses Turbopack by default)
- Check `next.config.ts` for `turbopackFileSystemCache`

**TypeScript:**
- `typescript` in devDependencies
- `@types/*` packages present

**UI Library:**
- `@radix-ui/*`: Radix UI
- `@chakra-ui/react`: Chakra UI
- `@mantine/core`: Mantine
- `@mui/material`: Material UI
- `@headlessui/react`: Headless UI

### 5. Detect Third-Party Integrations

**Analytics:**
- `@vercel/analytics`: Vercel Analytics
- `react-ga4` or `@google-analytics/*`: Google Analytics
- `mixpanel-browser`: Mixpanel
- `posthog-js`: PostHog
- `@sentry/nextjs`: Sentry

**Auth:**
- `next-auth`: NextAuth.js
- `@auth0/nextjs-auth0`: Auth0
- `@clerk/nextjs`: Clerk
- `firebase`: Firebase Auth

**CMS/Database:**
- `@sanity/client`: Sanity
- `contentful`: Contentful
- `@prisma/client`: Prisma
- `drizzle-orm`: Drizzle

### 6. Analyze Project Structure

**Step: Check directory structure**
- `app/` directory: App Router (Next.js 13+)
- `pages/` directory: Pages Router
- `src/` directory: Source organization
- `components/` directory: Component organization

### 7. Generate Context Report

Compile all detected information into a structured report.

## Output

### Project Context Summary

```
📦 Project: {project-name}
🔧 Package Manager: npm/yarn/pnpm

📱 Framework
├── Name: Next.js
├── Version: 14.x.x
├── Router: App Router
├── Rendering: Hybrid (SSR/SSG/ISR)
└── Features: Auth, Font Optimization

🎨 Styling
├── CSS Solution: Tailwind CSS
├── UI Library: Radix UI / shadcn/ui
└── TypeScript: Yes

📊 Analytics & Monitoring
├── Vercel Analytics
├── Sentry
└── Google Analytics

🔌 Integrations
├── Auth: NextAuth.js
├── Database: Prisma
└── CMS: Sanity

📁 Structure
├── Router Type: App Router
├── Source Dir: src/
└── Components: src/components/
```

### Performance Implications

Based on the detected stack:

| Technology | Performance Consideration |
|------------|---------------------------|
| Next.js 16 | Use `"use cache"` directive, React Compiler, Turbopack |
| Next.js 15 | Use `cache: 'force-cache'`, route segment configs |
| App Router | Leverage Server Components, streaming |
| Tailwind CSS | Purge unused styles in production |
| Prisma | Consider edge-compatible alternatives if needed |
| Analytics | Defer loading, use `lazyOnload` strategy |

### Recommended Optimizations

Based on your stack:

1. **Images**: Use `next/image` with priority for LCP images
2. **Fonts**: Use `next/font` for automatic font optimization
3. **Scripts**: Use `next/script` with appropriate strategies
4. **Bundle**: Enable `reactCompiler` and `turbopackFileSystemCache`
5. **Caching**: Use `"use cache"` directive (Next.js 16) or route segment configs
6. **Analytics**: Load analytics with `lazyOnload` strategy

### Files to Review

- `next.config.js` or `next.config.ts` - Build configuration
- `app/layout.tsx` - Root layout for fonts, scripts
- `app/proxy.ts` - Request proxying (Next.js 16)
- `tailwind.config.js` - Tailwind purge settings
- `middleware.ts` - Edge middleware if present

## Usage in Other Prompts

This context can be referenced by other prompts:

```markdown
## Prerequisites
- Reference: `.github/prompts/detect-context.prompt.md` output
```

The detected context enables framework-specific recommendations in:
- `optimize-lcp` - LCP optimization
- `optimize-bundle` - Bundle optimization
- `optimize-images` - Image optimization
- `analyze-performance` - Full analysis
