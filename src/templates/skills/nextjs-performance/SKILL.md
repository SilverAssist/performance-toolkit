---
name: nextjs-performance
description: Optimize Next.js 16 App Router performance including LCP, Cache Components with "use cache" directive, Turbopack, Server/Client Components architecture, and image preloading. Use when working on Next.js performance issues, LCP optimization, or component architecture decisions.
---

# Next.js 16 App Router Performance Optimization

Expert knowledge for optimizing Next.js 16 App Router applications, based on real-world optimizations achieving FCP -55%, SI -61%.

> **Next.js 16 Key Changes:**
> - **Cache Components** with `"use cache"` directive (replaces route segment configs)
> - **Turbopack** is now the default bundler (2-5x faster builds)
> - **Async Dynamic APIs** - `params`, `searchParams`, `cookies()`, `headers()` must be awaited
> - **Node.js 20.9+** required
> - **React 19.2** with View Transitions and Activity component
> - **React Compiler** for automatic memoization
> - **proxy.ts** - new file convention for request proxying

## When to Use This Skill

- Debugging LCP (Largest Contentful Paint) issues in Next.js 16
- Migrating from Next.js 15 route segment configs to Cache Components
- Optimizing image loading and preloading
- Restructuring Server/Client Component architecture
- Implementing Cache Components with `"use cache"` directive
- Configuring Turbopack optimizations
- Analyzing Core Web Vitals issues

## Cache Components & "use cache" Directive

> ⚠️ **Paradigm Shift in Next.js 16**: Caching is now explicit opt-in with `"use cache"`.
> Route segment configs like `revalidate`, `dynamic`, `fetchCache` are replaced.

### Enabling Cache Components

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  cacheComponents: true, // Enables Cache Components (includes PPR by default)
};

export default config;
```

### Using "use cache" Directive

```typescript
// File-level caching
'use cache'
import { cacheLife } from 'next/cache';

export default async function Page() {
  cacheLife('hours'); // Configure cache duration
  const data = await fetch('/api/data');
  return <div>{data}</div>;
}

// Component-level caching
async function BlogPosts() {
  'use cache'
  cacheLife('hours')
  const posts = await fetch('/api/posts');
  return <ul>{posts.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}

// Function-level caching
async function getData() {
  'use cache'
  cacheLife('days')
  return fetch('/api/data');
}
```

### Cache Profiles (Built-in)

| Profile | Use Case |
|---------|----------|
| `'seconds'` | Very short cache |
| `'minutes'` | Short cache |
| `'hours'` | Medium cache (recommended default) |
| `'days'` | Long cache |
| `'weeks'` | Very long cache |
| `'max'` | Maximum cache duration |

### Custom Cache Profile

```typescript
import { cacheLife } from 'next/cache';

cacheLife({
  stale: 3600,      // 1 hour client-side
  revalidate: 7200, // 2 hours server-side
  expire: 86400,    // 1 day max
});
```

### Cache Tags for Revalidation

```typescript
import { cacheLife, cacheTag, updateTag } from 'next/cache';

async function getCart() {
  'use cache'
  cacheTag('cart')
  cacheLife('hours')
  return fetch('/api/cart');
}

// In Server Action - immediately invalidate
async function addToCart(itemId: string) {
  'use server'
  await db.cart.add(itemId);
  updateTag('cart'); // Immediately invalidates and refreshes
}
```

### Migration from Next.js 15 Patterns

```typescript
// ❌ Next.js 15 (deprecated with cacheComponents)
export const dynamic = 'force-static';
export const revalidate = 3600;

export default async function Page() {
  const data = await fetch('/api/data', { cache: 'force-cache' });
  return <div>{data}</div>;
}

// ✅ Next.js 16 with Cache Components
import { cacheLife } from 'next/cache';

export default async function Page() {
  'use cache'
  cacheLife('hours')
  const data = await fetch('/api/data');
  return <div>{data}</div>;
}
```

## Turbopack (Default Bundler)

Turbopack is now the **default bundler** in Next.js 16.

### Performance Benefits

- 2-5x faster production builds
- 10x faster Fast Refresh in development
- 10-14x faster dev server restarts (with FS caching)

### Configuration

```typescript
// next.config.ts
const nextConfig = {
  // Enable Turbopack File System Cache (16.1+)
  turbopackFileSystemCache: true,
};
```

### CLI Options

```bash
# Development (Turbopack is default)
next dev

# Force webpack (if needed for compatibility)
next dev --webpack

# Production build (Turbopack)
next build

# Bundle analysis (experimental in 16.1)
next experimental-analyze
```

## Async Dynamic APIs (Breaking Change)

All dynamic APIs must now be awaited:

```typescript
// ❌ Next.js 15 (deprecated)
export default function Page({ params, searchParams }) {
  const { slug } = params;
  const { q } = searchParams;
}

// ✅ Next.js 16
export default async function Page({ params, searchParams }) {
  const { slug } = await params;
  const { q } = await searchParams;
}

// Also applies to:
const cookieStore = await cookies();
const headersList = await headers();
const { isEnabled } = await draftMode();
```

## Image Optimization (Next.js 16 Defaults)

### Changed Defaults

```typescript
// next.config.ts - Next.js 16 new defaults
const nextConfig = {
  images: {
    minimumCacheTTL: 14400,     // 4 hours (was 60 seconds in Next.js 15)
    quality: [75],              // Coerced to single value
  },
};
```

### New Requirement for Local Development

```typescript
// next.config.ts - Required for localhost image sources
const nextConfig = {
  images: {
    dangerouslyAllowLocalIP: true,
  },
};
```

### Migration from images.domains

```typescript
// ❌ Deprecated
images: {
  domains: ['example.com'],
}

// ✅ Use remotePatterns
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'example.com',
    },
  ],
}
```

## Critical: LCP Image Preload in App Router

> ⚠️ **The `priority` prop on `<Image>` only works in Server Components.**
> In Client Components (or children of Client Components), the preload link ends up in `<body>` instead of `<head>`, making it useless for LCP.

### Why This Happens

Next.js App Router uses streaming. When `<Image priority>` is in a Client Component:

1. The shell (`<head>`) is sent first
2. Client Components stream later
3. The preload from `priority` arrives in `<body>` - too late for LCP

### The Correct Pattern

```typescript
// layout.tsx - PRELOAD HERE (renders before children stream)
import { getImageProps } from "next/image";
import { preload } from "react-dom";

export default async function Layout({ children, params }) {
  const resolvedParams = await params; // Next.js 16: await params
  const data = await getData(resolvedParams);
  
  if (data.lcpImage) {
    const imageProps = getImageProps({ 
      src: data.lcpImage, 
      width: 1200, 
      height: 600, 
      alt: "" 
    });
    
    preload(imageProps.props.src, {
      as: "image",
      fetchPriority: "high",
      imageSrcSet: imageProps.props.srcSet,
      imageSizes: imageProps.props.sizes,
    });
  }
  
  return <>{children}</>;
}
```

```typescript
// In the component - NO priority prop, use loading="eager" + fetchPriority
<Image 
  src={url} 
  loading="eager" 
  fetchPriority="high"
  width={1200}
  height={600}
  alt="Hero image"
/>
```

## Server/Client Component Architecture

### The Problem

```typescript
// ❌ WRONG: Parent "use client" makes ALL children Client Components
"use client";
export function Header() {
  return <Gallery />;  // Gallery loses Server Component benefits!
}
```

When a parent has `"use client"`, ALL children become Client Components, even if they don't have the directive. This breaks LCP preloading and increases bundle size.

### The Solution: Push Client Boundaries to Leaves

```typescript
// ✅ CORRECT: Server parent, isolated Client leaves
// Header.tsx (Server Component - no "use client")
export function Header() {
  return (
    <>
      <Gallery />     {/* Server Component - LCP works */}
      <LeadModal />   {/* Has its own "use client" */}
    </>
  );
}

// LeadModal.tsx
"use client";
export function LeadModal() {
  // Interactive code here
}
```

### Reducing JS Bundle Size

Add `'use client'` to specific interactive components instead of marking large parts of UI as Client Components:

```typescript
// ✅ Layout is Server Component, only Search needs client
import Search from './search';  // Client Component
import Logo from './logo';      // Server Component

export default function Layout({ children }) {
  return (
    <>
      <nav>
        <Logo />      {/* Zero JS sent to client */}
        <Search />    {/* Only this sends JS */}
      </nav>
      {children}
    </>
  );
}
```

### Key Principles

1. **Push `"use client"` to leaves** - Only add it to components that truly need interactivity
2. **Keep LCP elements in Server Components** - Images, hero sections, main content
3. **Pass Server data as props** - Don't fetch in Client Components what you can fetch on server
4. **Render providers as deep as possible** - Wrap `{children}` not entire `<html>`
5. **Use `server-only` package** - Prevent accidental client imports of server code

## React Compiler (Automatic Memoization)

React Compiler is now stable in Next.js 16, eliminating the need for manual `useMemo`/`useCallback`.

### Enabling React Compiler

```typescript
// next.config.ts
const nextConfig = {
  reactCompiler: true,
};
```

### Performance Benefits

- Eliminates need for manual memoization (`useMemo`, `useCallback`, `memo`)
- Reduces bundle size (no memoization wrapper code)
- Automatically optimizes re-renders
- Fixes issues from missing dependencies in hooks

## View Transitions (React 19.2)

View Transitions enable smooth page transitions without layout shifts.

### Enabling View Transitions

```typescript
// next.config.ts
const nextConfig = {
  viewTransition: true,
};
```

### Using View Transitions

```typescript
import { useViewTransition } from 'react';

function Component() {
  const [isPending, startViewTransition] = useViewTransition();
  
  return (
    <button onClick={() => startViewTransition(() => {
      // State updates with smooth transitions
      setShowDetails(true);
    })}>
      {isPending ? 'Loading...' : 'Show Details'}
    </button>
  );
}
```

### CLS Impact

View Transitions help prevent CLS by:
- Maintaining visual stability during navigation
- Smoothly transitioning layout changes
- Preserving scroll position with Activity component

## proxy.ts (New File Convention)

New file convention for request proxying with clearer network boundary.

### middleware.ts vs proxy.ts

| Feature | middleware.ts | proxy.ts |
|---------|---------------|----------|
| Runtime | Edge Runtime | Node.js Runtime |
| Use Case | Auth, redirects | API proxying |
| Access | Limited APIs | Full Node.js APIs |

### Example proxy.ts

```typescript
// app/proxy.ts
import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Proxy to external API
  if (url.pathname.startsWith('/api/external')) {
    return NextResponse.rewrite(
      new URL('https://api.example.com' + url.pathname)
    );
  }
  
  return NextResponse.next();
}
```

## Context Providers Pattern

```typescript
// app/providers.tsx
"use client";
import { ThemeProvider } from './theme-provider';

export function Providers({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

// app/layout.tsx (Server Component)
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>  {/* Wrap only children */}
      </body>
    </html>
  );
}
```

> **Good to know:** Render providers as deep as possible in the tree. Notice how `ThemeProvider` only wraps `{children}` instead of the entire `<html>` document. This makes it easier for Next.js to optimize the static parts of your Server Components.

## Parallel Routes Require default.js

In Next.js 16, parallel routes require explicit default.js:

```typescript
// ❌ Next.js 15 - fallback UI optional
app/@modal/page.tsx

// ✅ Next.js 16 - explicit default.tsx required
app/@modal/page.tsx
app/@modal/default.tsx  // REQUIRED for proper fallback
```

## Route Handlers Caching

```typescript
// app/api/data/route.ts
import { cacheLife, cacheTag } from 'next/cache';

// ✅ CACHED with "use cache" (Next.js 16)
export async function GET() {
  'use cache'
  cacheLife('hours')
  cacheTag('api-data')
  
  const data = await fetch('https://...');
  return Response.json(data);
}
```

## Verification Commands

### Check if preload is in `<head>`

```bash
curl -s "https://your-site.com" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Accept: text/html" \
  | tr '>' '\n' | grep -n 'as="image"\|</head'
```

The preload line number should be LESS than the `</head>` line number.

### Check for `fetchpriority="high"` on LCP image

```bash
curl -s "https://your-site.com" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Accept: text/html" \
  | grep -i 'fetchpriority="high"'
```

## Common Mistakes to Avoid

1. **Using deprecated route segment configs** - Use `"use cache"` instead of `revalidate`, `dynamic`
2. **Not awaiting params/searchParams** - All dynamic APIs must be awaited in Next.js 16
3. **Using `priority` in Client Components** - It won't work as expected
4. **Wrapping LCP images in Client Component parents** - Breaks preloading
5. **Not using `getImageProps()` for manual preloads** - Loses srcset/sizes optimization
6. **Forgetting `fetchPriority="high"` on the actual image** - Preload alone isn't enough
7. **Using `loading="lazy"` on LCP images** - Defeats the purpose
8. **Not wrapping dynamic content in Suspense** - Prevents PPR benefits
9. **Wrapping entire `<html>` in providers** - Prevents static optimization
10. **Using `unstable_cache`** - Deprecated, use `"use cache"` instead

## Debugging Checklist

1. [ ] Is the LCP element in a Server Component?
2. [ ] Is `ReactDOM.preload()` called in `layout.tsx`?
3. [ ] Does the preload appear in `<head>` (not `<body>`)?
4. [ ] Does the image have `fetchPriority="high"`?
5. [ ] Is `loading="eager"` set (not lazy)?
6. [ ] Are parent components Server Components?
7. [ ] Is `"use cache"` configured for cached data?
8. [ ] Are `params` and `searchParams` being awaited?
9. [ ] Is dynamic content wrapped in `<Suspense>`?
10. [ ] Are context providers rendered deep, not wrapping `<html>`?
11. [ ] Is React Compiler enabled for automatic memoization?

## Removed Features in Next.js 16

| Feature | Status | Replacement |
|---------|--------|-------------|
| `next lint` | **REMOVED** | Use `eslint` directly |
| AMP Support | **REMOVED** | No replacement |
| `next/legacy/image` | **REMOVED** | Use `next/image` |
| `experimental.ppr` | **REMOVED** | Use `cacheComponents: true` |
| `images.domains` | **DEPRECATED** | Use `images.remotePatterns` |
| `unstable_cache` | **DEPRECATED** | Use `"use cache"` directive |
| `runtime: 'edge'` | **NOT SUPPORTED** | Not compatible with Cache Components |

## Related Resources

- [Next.js 16 Release Blog](https://nextjs.org/blog/next-16)
- [Cache Components Documentation](https://nextjs.org/docs/app/getting-started/cache-components)
- [use cache Directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [Upgrading to Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Image Optimization](https://nextjs.org/docs/app/getting-started/images)
