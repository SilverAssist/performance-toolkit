---
agent: agent
description: Optimize Largest Contentful Paint (LCP) with framework-specific implementation for Next.js 16
---

# Optimize LCP

Optimize the Largest Contentful Paint element to achieve < 2.5 seconds.

## Prerequisites

- Run `analyze-performance` first to identify the LCP element
- Access to the codebase
- Reference: `.github/prompts/_partials-performance/performance-patterns.md`

## Next.js 16 Considerations

> **Image optimization defaults changed in Next.js 16:**
> - `minimumCacheTTL` is now 4 hours (was 60 seconds)
> - Default quality is 75
> - `images.domains` is deprecated, use `remotePatterns`
> - `params` and `searchParams` must be awaited

## Context Required

Before starting, gather:
1. LCP element type (image, text, video, background-image)
2. Current LCP timing breakdown (TTFB, load delay, render delay)
3. Framework being used (Next.js, React, Vue, etc.)
4. Current loading mechanism (eager, lazy, priority)

## Steps

### 1. Locate LCP Element in Code

**Step: Find the component**
1. Use the selector from the analysis to find the element
2. Identify the component/page where it's rendered
3. **Critical: Check if it's a Server or Client Component**
4. Note any dynamic loading or conditional rendering

> ⚠️ **Critical Next.js Learning**: When using `priority` on `<Image>` in a **Client Component**, 
> the preload link gets added to `<body>` instead of `<head>` due to streaming. This defeats the 
> purpose of preloading. See section 2A for the correct approach.

### 2. Implement Priority Loading

#### 2A. Next.js App Router - CORRECT Approach (Server Components)

> **Why this matters**: In Next.js App Router with streaming, child components render AFTER 
> `</head>` closes. Any `preload()` call or `priority` prop in a child component will place 
> the preload tag in `<body>`, not `<head>`.

**Step 1: Preload in layout.tsx (CRITICAL)**

```typescript
// app/[...slug]/layout.tsx - CORRECT PLACEMENT
import { getImageProps } from "next/image";
import { preload } from "react-dom";

export default async function Layout({ children, params }) {
  // Next.js 16: params must be awaited
  const resolvedParams = await params;
  const data = await getData(resolvedParams);
  const lcpImageUrl = data.heroImage;

  if (lcpImageUrl) {
    // Use getImageProps to get the EXACT optimized srcSet URLs
    // This ensures the preloaded URL matches the rendered image URL
    const lcpImageProps = getImageProps({
      src: lcpImageUrl,
      width: 1200,
      height: 600,
      alt: "Hero",
    });

    if (lcpImageProps?.props.srcSet) {
      preload(lcpImageProps.props.src as string, {
        as: "image",
        fetchPriority: "high",
        imageSrcSet: lcpImageProps.props.srcSet,
        imageSizes: lcpImageProps.props.sizes,
      });
    }
  }

  return <>{children}</>;
}
```

**Step 2: Image component WITHOUT priority**

```typescript
// components/Hero.tsx - NO priority prop
import Image from "next/image";

export function Hero({ imageUrl }: { imageUrl: string }) {
  return (
    <Image
      src={imageUrl}
      alt="Hero"
      width={1200}
      height={600}
      loading="eager"        // Prevents lazy loading
      fetchPriority="high"   // Tells browser to prioritize
      // NO priority={true} - would duplicate the preload
    />
  );
}
```

**Step 3: Verify preload placement**

```bash
# Check that preload is in <head>, not <body>
# Use browser headers to avoid WAF/CDN blocks (CloudFront, Cloudflare, etc.)
curl -s "https://your-site.com/page" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8" \
  -H "Accept-Language: en-US,en;q=0.5" \
  | tr '>' '\n' | grep -n 'as="image"\|</head'

# Expected output:
# 6:<link rel="preload" as="image" fetchPriority="high" imageSrcSet="/_next/image?...
# 100:</head>
# Preload line < </head> line = SUCCESS ✅
```

#### 2B. Next.js - Simple Approach (Server Components Only)

If your LCP component is a **Server Component** (no `"use client"`), you can use `priority`:

```typescript
import Image from 'next/image';

// Hero image in SERVER COMPONENT - priority works correctly
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // Only works correctly in Server Components
  quality={85}
  sizes="100vw"
/>
```

#### 2C. Convert Client Component Parent to Server Component

If your LCP image is inside a Client Component tree, consider refactoring:

```typescript
// BEFORE: Parent is Client Component - ALL children become client
// "use client"
export function Header({ data }) {
  return (
    <section>
      <Gallery images={data.images} />  {/* Client - loses Server benefits */}
    </section>
  );
}

// AFTER: Parent is Server Component with isolated Client boundaries
export function Header({ data }) {
  return (
    <section>
      <Breadcrumbs items={data.breadcrumbs} />  {/* Client - own "use client" */}
      <Gallery images={data.images}>           {/* Server Component ✅ */}
        <GalleryInteractive />                  {/* Client - own "use client" */}
      </Gallery>
    </section>
  );
}
```

#### 2D. Standard HTML Images

```html
<!-- Add priority hint -->
<img 
  src="/hero.jpg" 
  alt="Hero image"
  width="1200"
  height="600"
  fetchpriority="high"
  decoding="async"
/>
```

#### 2E. Background Images

```html
<!-- Preload in head -->
<link 
  rel="preload" 
  href="/hero-bg.webp" 
  as="image"
  type="image/webp"
  fetchpriority="high"
/>
```

### 3. Add Resource Preloading

> **Note**: For Next.js App Router, do NOT use `metadata.other` for preload links.
> It generates `<meta>` tags, NOT `<link>` tags. Use `ReactDOM.preload()` instead.

**Step: Add preload hints**

For Next.js - Use ReactDOM.preload() in layout (see section 2A above).

For standard HTML:
```html
<link rel="preload" href="/hero.jpg" as="image" fetchpriority="high" />
<link rel="preconnect" href="https://images.example.com" crossorigin />

For standard HTML:
```html
<head>
  <!-- Preload LCP image -->
  <link rel="preload" href="/hero.jpg" as="image" fetchpriority="high" />
  
  <!-- Preconnect to image CDN -->
  <link rel="preconnect" href="https://cdn.example.com" crossorigin />
  
  <!-- DNS prefetch for third-parties -->
  <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
</head>
```

### 4. Optimize TTFB (If > 600ms)

**Step: Implement caching strategies**

For Next.js 16 with Cache Components:
```typescript
// app/page.tsx
import { cacheLife, cacheTag } from 'next/cache';

export default async function Page() {
  'use cache'
  cacheLife('hours')
  cacheTag('hero-page')
  
  const data = await fetch('https://api.example.com/hero');
  return <HeroSection data={data} />;
}
```

> **Note**: Route segment configs like `export const revalidate` are deprecated
> with `cacheComponents: true`. Use the `"use cache"` directive instead.

For Edge caching:
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};
```

### 5. Reduce Render Blocking

**Step: Inline critical CSS**
1. Identify CSS needed for LCP element
2. Inline it in the document head
3. Defer non-critical CSS

```typescript
// For Next.js, critical CSS is automatic with CSS Modules
// For custom solutions:
import styles from './hero.module.css';

// CSS Modules automatically scope and can be critical-path extracted
```

**Step: Defer non-critical JavaScript**
```typescript
// Next.js - use dynamic imports
import dynamic from 'next/dynamic';

const HeavyAnalytics = dynamic(() => import('./Analytics'), {
  ssr: false,
  loading: () => null,
});

// Standard - use defer/async
<script src="/analytics.js" defer />
```

### 6. Optimize LCP Image

**Step: Ensure proper format and sizing**

```typescript
// Next.js Image with optimization
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 1200px"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

**Step: Use responsive images**
```html
<picture>
  <source 
    media="(min-width: 1024px)" 
    srcset="/hero-large.webp" 
    type="image/webp"
  />
  <source 
    media="(min-width: 768px)" 
    srcset="/hero-medium.webp" 
    type="image/webp"
  />
  <img 
    src="/hero-small.jpg" 
    alt="Hero"
    width="400"
    height="300"
    fetchpriority="high"
  />
</picture>
```

### 7. Verify Improvements

**Step: Re-run analysis**
```bash
npx perf-check {url} --desktop --verbose
npx perf-check {url} --mobile --verbose
```

Compare before/after:
- LCP time reduction
- TTFB improvement
- Load delay reduction

## Output

### Changes Made

| Change | File | Impact |
|--------|------|--------|
| Added priority prop | `components/Hero.tsx` | -XXXms LCP |
| Added preload link | `app/layout.tsx` | -XXXms load delay |
| Deferred analytics | `app/layout.tsx` | -XXXms render delay |

### Before/After

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| LCP | X.Xs | X.Xs | -XX% |
| TTFB | XXXms | XXXms | -XX% |

### Verification Checklist

- [ ] LCP element has `loading="eager"` and `fetchPriority="high"`
- [ ] Preload link is in `<head>` (verified with curl command below)
- [ ] Only ONE preload tag exists (no duplicates)
- [ ] TTFB is under 800ms
- [ ] No render-blocking resources before LCP
- [ ] Re-analysis shows improvement

### Preload Verification Commands

> ⚠️ **WAF/CDN Note**: Production sites with CloudFront, Cloudflare, or WAF may block
> requests without proper browser headers. Always use the headers below. If you get
> 403/503 errors or empty responses, ask the user for specific headers (Authorization,
> cookies, custom headers required by their infrastructure).

```bash
# Define headers (reuse for all commands)
HEADERS='-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml" -H "Accept-Language: en-US,en;q=0.5"'

# Check preload position (should be BEFORE </head>)
eval curl -s $HEADERS "URL" | tr '>' '\n' | grep -n 'as="image"\|</head'

# Count preload tags (should be exactly 1)
eval curl -s $HEADERS "URL" | tr '>' '\n' | grep -c 'as="image"'

# View full preload tag
eval curl -s $HEADERS "URL" | grep -o '<link[^>]*as="image"[^>]*>'

# If blocked, try with additional headers:
# -H "Cookie: session=..."           # For authenticated pages
# -H "Authorization: Bearer ..."     # For API-protected pages  
# -H "X-Custom-Header: value"        # For custom WAF rules
```

## Framework Reference

### Next.js 16
- [Cache Components](https://nextjs.org/docs/app/getting-started/cache-components)
- [Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Script Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/scripts)
- [ReactDOM preload API](https://react.dev/reference/react-dom/preload)
- [getImageProps](https://nextjs.org/docs/app/api-reference/components/image#getimageprops)

### Critical Learning: Streaming & Client Components

In Next.js App Router, pages stream in chunks. The `<head>` closes early, then body content streams.
When `preload()` or `priority` is called in a child component, it arrives AFTER `</head>` closes,
placing the preload in `<body>` where it's less effective.

**Solution**: Always call `preload()` in `layout.tsx` which renders BEFORE children stream.

### Next.js 16 Breaking Changes for LCP

1. **Await params**: `const { slug } = await params;`
2. **Image cache TTL**: Default is now 4 hours (14400s)
3. **Use remotePatterns**: `images.domains` is deprecated
4. **Use "use cache"**: Route segment configs deprecated with cacheComponents

### General
- [Optimize LCP](https://web.dev/optimize-lcp/)
- [Preload critical assets](https://web.dev/preload-critical-assets/)
