---
agent: agent
description: Next.js 16 App Router specific performance optimizations with Cache Components and Turbopack
---

# Next.js 16 Performance Optimization

Optimize performance for Next.js 16 App Router applications with Cache Components, `"use cache"` directive, and Turbopack.

## Prerequisites

- Run `analyze-performance` first to identify issues
- Access to the codebase
- Reference: `.github/prompts/_partials-performance/performance-patterns.md`

## Next.js 16 Key Changes

> ⚠️ **Breaking Changes in Next.js 16:**
> - **Cache Components** with `"use cache"` directive (replaces route segment configs)
> - **Turbopack** is now the default bundler
> - **Async Dynamic APIs** - `params`, `searchParams`, `cookies()`, `headers()` must be awaited
> - **Node.js 20.9+** required
> - **React Compiler** for automatic memoization
> - **Image optimization** defaults changed (4 hour cache, quality 75)

## Critical Learnings

> These patterns are based on real-world optimizations that achieved:
> - FCP: -55% improvement (3.8s → 1.7s)
> - Speed Index: -61% improvement (5.1s → 2.0s)
> - Desktop LCP meeting "Good" threshold (< 2.5s)

### Understanding Next.js Streaming

In App Router, pages stream in chunks:

1. `layout.tsx` renders first → `<head>` opens
2. `<head>` content renders and CLOSES
3. Child components stream into `<body>`

**Implication**: Any `preload()` or `priority` prop in child components arrives AFTER `</head>` closes, placing preload tags in `<body>` where they're less effective.

## Steps

### 0. Configure Next.js 16 with Cache Components

**Step: Enable Cache Components in next.config.ts**

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true, // Enables Cache Components (includes PPR by default)
  reactCompiler: true,   // Enable React Compiler for auto-memoization
  turbopackFileSystemCache: true, // Faster dev rebuilds
};

export default nextConfig;
```

**Step: Use "use cache" directive instead of route segment configs**

```typescript
// ❌ Next.js 15 (deprecated with cacheComponents)
export const dynamic = 'force-static';
export const revalidate = 3600;

export default async function Page() {
  const data = await fetch('/api/data', { cache: 'force-cache' });
  return <div>{data}</div>;
}

// ✅ Next.js 16 with Cache Components
import { cacheLife, cacheTag } from 'next/cache';

export default async function Page() {
  'use cache'
  cacheLife('hours')
  cacheTag('products')
  
  const data = await fetch('/api/data');
  return <div>{data}</div>;
}
```

**Step: Use updateTag for instant revalidation**

```typescript
// In a Server Action
import { updateTag } from 'next/cache';

async function addProduct(formData: FormData) {
  'use server'
  await db.products.create(...);
  updateTag('products'); // Immediately invalidates and refreshes
}
```

### 0.5. Update Dynamic APIs (Breaking Change)

**Step: Await params, searchParams, and other dynamic APIs**

```typescript
// ❌ Next.js 15 (broken in Next.js 16)
export default function Page({ params, searchParams }) {
  const { slug } = params;
  const { q } = searchParams;
}

// ✅ Next.js 16
export default async function Page({ params, searchParams }) {
  const { slug } = await params;
  const { q } = await searchParams;
}

// Also update:
const cookieStore = await cookies();
const headersList = await headers();
const { isEnabled } = await draftMode();
```

### 1. Audit Component Architecture

**Step: Check Server vs Client Component boundaries**

```bash
# Find all "use client" directives
grep -rn '"use client"' --include="*.tsx" --include="*.ts" src/

# Check if LCP-related components are Client Components
# Look for the component that renders the hero/main image
```

**Identify the problem pattern:**
```typescript
// ❌ PROBLEM: Parent is Client Component
"use client";
export function Header({ data }) {
  return (
    <section>
      <Gallery images={data.images} />  {/* ALL children are now Client! */}
    </section>
  );
}
```

### 2. Refactor to Server Components

**Step: Convert parent to Server Component**

```typescript
// ✅ SOLUTION: Server Component parent

// components/header/index.tsx (NO "use client")
import dynamic from 'next/dynamic';

// Lazy load client-only features
const LeadModal = dynamic(() => import('./lead-modal'), { ssr: false });

export function Header({ data }) {
  return (
    <section>
      <Breadcrumbs items={data.breadcrumbs} />  {/* Client - own boundary */}
      <Gallery images={data.images} />          {/* Server Component ✅ */}
      <LeadModal />                             {/* Client - lazy loaded */}
    </section>
  );
}
```

**Isolate client boundaries:**
```typescript
// components/header/lead-modal.tsx
"use client";

export default function LeadModal() {
  const [isOpen, setIsOpen] = useState(false);
  // Client-only logic here
}
```

### 3. Implement Correct LCP Preloading

**Step: Preload in layout.tsx (CRITICAL)**

> **Why layout.tsx?** It renders BEFORE children stream, guaranteeing `<head>` placement.

```typescript
// app/[...slug]/layout.tsx
import { getImageProps } from "next/image";
import { preload } from "react-dom";

export default async function Layout({ children, params }) {
  // Next.js 16: await params
  const resolvedParams = await params;
  
  // Fetch data needed for preload decision
  const data = await getData(resolvedParams);
  
  // Determine LCP image URL
  const images = data.images?.gallery || [];
  const hasEnoughImages = images.length >= 4;
  const lcpImage = hasEnoughImages ? images[0] : null;

  // Preload LCP image at layout level
  if (lcpImage) {
    const imageProps = getImageProps({
      src: lcpImage,
      width: 1200,  // Match your actual render dimensions
      height: 600,
      alt: "Hero",
    });

    if (imageProps?.props.srcSet) {
      preload(imageProps.props.src as string, {
        as: "image",
        fetchPriority: "high",
        imageSrcSet: imageProps.props.srcSet,
        imageSizes: imageProps.props.sizes,
      });
    }
  }

  return (
    <Providers>
      {children}
    </Providers>
  );
}
```

**Step: Render Image WITHOUT priority**

```typescript
// components/gallery/index.tsx (Server Component)
import Image from "next/image";

export function Gallery({ images }) {
  return (
    <div>
      <Image
        src={images[0]}
        alt="Main image"
        width={1200}
        height={600}
        loading="eager"        // Prevents lazy loading
        fetchPriority="high"   // Browser hint
        // NO priority - preload handled in layout.tsx
      />
    </div>
  );
}
```

### 4. Verify Preload Placement

**Step: Check HTML output**

> ⚠️ **WAF/CDN Note**: Production sites (CloudFront, Cloudflare, Vercel) may block requests
> without browser headers. If you get 403/503 errors, ask user for required headers.

```bash
# Define browser headers (required for most production sites)
HEADERS='-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml" -H "Accept-Language: en-US,en;q=0.5"'

# Check preload is in <head>, not <body>
eval curl -s $HEADERS "https://your-site.com/page" | tr '>' '\n' | grep -n 'as="image"\|</head'

# Expected: preload line number < </head> line number
# Example:
# 6:<link rel="preload" as="image" ...
# 100:</head
# ✅ 6 < 100 = SUCCESS

# Count preloads (should be exactly 1)
eval curl -s $HEADERS "https://your-site.com/page" | tr '>' '\n' | grep -c 'as="image"'

# View the full preload tag
eval curl -s $HEADERS "https://your-site.com/page" | grep -o '<link[^>]*as="image"[^>]*>'
```

### 5. Optimize Third-Party Scripts

**Step: Identify blocking scripts**

Common culprits from real-world analysis:
- TrustedForm: ~144ms blocking
- Google Analytics: ~126ms blocking
- Google Tag Manager: ~53ms blocking
- Facebook Pixel: ~35ms (39% unused)
- CrazyEgg: ~39ms (77% unused)

**Step: Lazy load third-party scripts**

```typescript
// Option 1: next/script with lazyOnload
import Script from 'next/script';

<Script 
  src="https://www.googletagmanager.com/gtag/js?id=G-XXXXX"
  strategy="lazyOnload"
/>

// Option 2: Load on user interaction
"use client";

export function ThirdPartyScripts() {
  useEffect(() => {
    const loadScripts = () => {
      // TrustedForm
      const tf = document.createElement('script');
      tf.src = 'https://cdn.trustedform.com/trustedform.js';
      document.body.appendChild(tf);
      
      // CrazyEgg
      const ce = document.createElement('script');
      ce.src = 'https://script.crazyegg.com/pages/scripts/xxxx.js';
      document.body.appendChild(ce);
    };
    
    // Load after scroll, click, or 5s timeout
    const events = ['scroll', 'click', 'touchstart'];
    events.forEach(e => window.addEventListener(e, loadScripts, { once: true }));
    const timer = setTimeout(loadScripts, 5000);
    
    return () => {
      events.forEach(e => window.removeEventListener(e, loadScripts));
      clearTimeout(timer);
    };
  }, []);
  
  return null;
}
```

### 6. External CDN Image Optimization

If images come from external CDNs (S3, CloudFront), they may not be optimized:

**Problem:**
- External images bypass Next.js optimization
- No automatic WebP/AVIF conversion
- No responsive sizing

**Solutions:**

```typescript
// Option 1: Ensure external images go through Next.js proxy
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: '*.s3.amazonaws.com' },
      { hostname: '*.cloudfront.net' },
    ],
    formats: ['image/avif', 'image/webp'],
    // New in Next.js 16: longer cache by default (4 hours)
    minimumCacheTTL: 14400,
  },
};

// Then use next/image - it will proxy and optimize
<Image src="https://example.cloudfront.net/image.jpg" ... />

// Option 2: Use a dedicated image CDN
// Cloudinary, imgix, Cloudflare Images
// These optimize on-the-fly

// Option 3: Pre-optimize at upload time
// Convert to WebP/AVIF before uploading to S3
```

### 7. Extend Asset Cache Duration

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

## Output

### Changes Checklist

- [ ] Enabled `cacheComponents: true` in next.config.ts
- [ ] Updated to `"use cache"` directive (replaced route segment configs)
- [ ] Awaiting `params` and `searchParams` in all pages/layouts
- [ ] Converted Client Component parents to Server Components
- [ ] Isolated client boundaries to leaf components
- [ ] Added `ReactDOM.preload()` in `layout.tsx`
- [ ] Removed `priority` prop from Image (using manual preload)
- [ ] Added `loading="eager"` and `fetchPriority="high"` to LCP image
- [ ] Verified preload is in `<head>` (curl check)
- [ ] Third-party scripts use `lazyOnload` or interaction-based loading
- [ ] External images configured in `remotePatterns`
- [ ] Cache headers set to 1 year for static assets
- [ ] React Compiler enabled for automatic memoization

### Before/After Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| LCP | | | |
| FCP | | | |
| TBT | | | |
| Performance | | | |

### Verification Commands

```bash
# Browser headers (required for production sites with WAF/CDN)
HEADERS='-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Accept: text/html"'

# Full check
eval curl -s $HEADERS "URL" | tr '>' '\n' | grep -n 'as="image"\|</head\|preload'

# LCP timing (use Chrome DevTools Performance tab)
# Or run analysis again
npx perf-check URL --mobile --insights
```

> **Troubleshooting curl errors:**
> - 403 Forbidden: WAF blocking - ask user for required headers
> - 503 Service Unavailable: Rate limiting - wait and retry
> - Empty response: Check if site requires authentication
> - Redirect loop: Add `-L` flag to follow redirects

## Common Mistakes to Avoid

| Mistake | Why it's wrong | Correct approach |
|---------|---------------|-----------------|
| Using route segment configs with `cacheComponents` | Deprecated in Next.js 16 | Use `"use cache"` directive |
| Not awaiting `params`/`searchParams` | Breaking change in Next.js 16 | Always `await params` |
| Using `unstable_cache` | Deprecated | Use `"use cache"` directive |
| Using `priority` in Client Component | Preload ends up in `<body>` | Use `ReactDOM.preload()` in layout |
| Using `metadata.other` for preload | Generates `<meta>`, not `<link>` | Use `ReactDOM.preload()` |
| Preloading in child component | Arrives after `</head>` closes | Preload in `layout.tsx` |
| Using both `priority` AND manual preload | Duplicate preloads | Use one or the other |
| Parent with `"use client"` | All children become Client | Isolate client to leaves |
| Wrapping entire `<html>` in providers | Prevents static optimization | Wrap only `{children}` in body |
| Missing Suspense for dynamic content | Blocks entire page render | Wrap dynamic content in Suspense |
| Manual `useMemo`/`useCallback` | Unnecessary with React Compiler | Enable `reactCompiler: true` |

## References

- [React: preload API](https://react.dev/reference/react-dom/preload)
- [Next.js 16: Cache Components](https://nextjs.org/docs/app/getting-started/cache-components)
- [Next.js 16: use cache Directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [Next.js 16: Upgrading Guide](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Next.js 16: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js 16: getImageProps](https://nextjs.org/docs/app/api-reference/components/image#getimageprops)
- [Next.js 16: Script Component](https://nextjs.org/docs/app/api-reference/components/script)
- [web.dev: Optimize LCP](https://web.dev/optimize-lcp/)
