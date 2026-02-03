---
name: nextjs-performance
description: Optimize Next.js 15 App Router performance including LCP, streaming, PPR (Partial Prerendering), Server/Client Components architecture, caching strategies, and image preloading. Use when working on Next.js performance issues, LCP optimization, or component architecture decisions.
---

# Next.js 15 App Router Performance Optimization

Expert knowledge for optimizing Next.js 15 App Router applications, based on real-world optimizations achieving FCP -55%, SI -61%.

> **Next.js 15 Key Changes:**
> - `fetch()` is NOT cached by default (opt-in with `cache: 'force-cache'`)
> - Partial Prerendering (PPR) available as experimental feature
> - `use cache` directive for granular caching control
> - Streaming metadata for improved perceived performance
> - React 19 features including `use()` hook

## When to Use This Skill

- Debugging LCP (Largest Contentful Paint) issues in Next.js 15
- Optimizing image loading and preloading
- Restructuring Server/Client Component architecture
- Implementing streaming-aware patterns
- Configuring caching strategies (Next.js 15 no longer caches fetch by default)
- Implementing Partial Prerendering (PPR)
- Analyzing Core Web Vitals issues

## Next.js 15 Caching Changes

> ⚠️ **Breaking Change in Next.js 15**: `fetch()` requests are NOT cached by default.
> You must explicitly opt-in to caching.

### Caching Strategies

```typescript
// ❌ NOT CACHED (Next.js 15 default behavior)
const data = await fetch('https://api.example.com/data');

// ✅ CACHED - opt-in with force-cache
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache'
});

// ✅ TIME-BASED REVALIDATION
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 } // Revalidate every hour
});

// ✅ TAG-BASED REVALIDATION
const data = await fetch('https://api.example.com/data', {
  next: { tags: ['products'] }
});
// Then revalidate with: revalidateTag('products')
```

### Using unstable_cache for Non-Fetch Operations

```typescript
import { unstable_cache } from 'next/cache';

const getCachedUser = unstable_cache(
  async (userId: string) => {
    return db.query.users.findFirst({ where: eq(users.id, userId) });
  },
  ['user-cache'], // cache key prefix
  { 
    revalidate: 3600,
    tags: ['users']
  }
);
```

## Partial Prerendering (PPR)

PPR allows combining static and dynamic content in the same route for optimal performance.

### Enabling PPR

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  experimental: {
    ppr: 'incremental', // Enable PPR incrementally per-route
  },
};

export default config;
```

### Using PPR in Routes

```typescript
// app/dashboard/layout.tsx
export const experimental_ppr = true;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <>
      {/* Static shell - prerendered at build time */}
      <StaticHeader />
      <StaticSidebar />
      
      {/* Dynamic content - streamed at request time */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DynamicDashboard />
      </Suspense>
    </>
  );
}
```

### What Makes Components Dynamic

A component becomes dynamic when it uses:
- `cookies()` or `headers()`
- `connection()` or `draftMode()`
- `searchParams` prop
- `unstable_noStore()`
- `fetch()` with `{ cache: 'no-store' }`

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
  const data = await getData(params);
  
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

### Reducing JS Bundle Size (Next.js 15 Best Practice)

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

## Streaming Metadata (Next.js 15)

Next.js 15 streams metadata separately, allowing visual content to render before metadata resolves:

```typescript
// app/blog/[slug]/page.tsx
export async function generateMetadata({ params }) {
  // This doesn't block UI rendering in Next.js 15
  const post = await fetchPost(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
  };
}
```

> **Note:** Streaming metadata is disabled for bots/crawlers (Twitterbot, Slackbot, Bingbot) that expect metadata in `<head>`. Customize with `htmlLimitedBots` config.

## Server Actions Configuration

```typescript
// next.config.js
module.exports = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['my-proxy.com', '*.my-proxy.com'],
    },
  },
};
```

## Image Optimization (Next.js 15)

### Local Images with Auto Dimensions

```typescript
import Image from 'next/image';
import profilePic from './profile.png';

// Width/height automatically inferred from static import
<Image src={profilePic} alt="Profile" />
```

### Remote Images with Required Config

```typescript
// next.config.ts
const config = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        port: '',
        pathname: '/my-bucket/**',
      },
    ],
  },
};
```

## Route Handlers Caching

```typescript
// app/api/data/route.ts

// ❌ NOT CACHED by default
export async function GET() {
  const data = await fetch('https://...');
  return Response.json(data);
}

// ✅ CACHED with config
export const dynamic = 'force-static';

export async function GET() {
  const data = await fetch('https://...');
  return Response.json(data);
}
```

## Middleware Best Practices

Middleware is effective for:
- Quick redirects after reading request
- Rewriting based on A/B tests
- Modifying headers

**NOT good for:**
- Slow data fetching
- Session management

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url));
}

export const config = {
  matcher: '/about/:path*',
};
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

1. **Assuming fetch is cached** - In Next.js 15, it's NOT cached by default
2. **Using `priority` in Client Components** - It won't work as expected
3. **Wrapping LCP images in Client Component parents** - Breaks preloading
4. **Not using `getImageProps()` for manual preloads** - Loses srcset/sizes optimization
5. **Forgetting `fetchPriority="high"` on the actual image** - Preload alone isn't enough
6. **Using `loading="lazy"` on LCP images** - Defeats the purpose
7. **Not wrapping dynamic content in Suspense** - Prevents PPR benefits
8. **Wrapping entire `<html>` in providers** - Prevents static optimization

## Debugging Checklist

1. [ ] Is the LCP element in a Server Component?
2. [ ] Is `ReactDOM.preload()` called in `layout.tsx`?
3. [ ] Does the preload appear in `<head>` (not `<body>`)?
4. [ ] Does the image have `fetchPriority="high"`?
5. [ ] Is `loading="eager"` set (not lazy)?
6. [ ] Are parent components Server Components?
7. [ ] Is caching explicitly configured for `fetch()` calls?
8. [ ] Is dynamic content wrapped in `<Suspense>`?
9. [ ] Are context providers rendered deep, not wrapping `<html>`?

## Related Resources

- [Next.js 15 Caching](https://nextjs.org/docs/15/app/getting-started/caching-and-revalidating)
- [Partial Prerendering](https://nextjs.org/docs/15/app/getting-started/partial-prerendering)
- [Server and Client Components](https://nextjs.org/docs/15/app/getting-started/server-and-client-components)
- [Image Optimization](https://nextjs.org/docs/15/app/getting-started/images)
- [Metadata and OG Images](https://nextjs.org/docs/15/app/getting-started/metadata-and-og-images)
- [Route Handlers and Middleware](https://nextjs.org/docs/15/app/getting-started/route-handlers-and-middleware)
