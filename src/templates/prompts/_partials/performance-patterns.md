# Performance Patterns Partial

Reusable performance optimization patterns for prompts. Updated for **Next.js 16**.

## Usage

Reference in other prompts:

```markdown
## Prerequisites
- Reference: `.github/prompts/_partials/performance-patterns.md`
```

---

## Next.js 16 Key Changes

> ⚠️ **Breaking Changes in Next.js 16:**
>
> - **Cache Components** with `"use cache"` directive (replaces route segment configs)
> - **Turbopack** is now the default bundler (2-5x faster builds)
> - **Async Dynamic APIs** - `params`, `searchParams`, `cookies()`, `headers()` must be awaited
> - **Node.js 20.9+** required
> - **React 19.2** with View Transitions and Activity component
> - **React Compiler** for automatic memoization
> - **Image defaults changed** - 4 hour cache, quality 75

---

## Cache Components & "use cache" Directive

### Enabling Cache Components

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  cacheComponents: true, // Enables Cache Components (includes PPR by default)
  reactCompiler: true,   // Automatic memoization
};

export default config;
```

### Using "use cache" Directive

```typescript
import { cacheLife, cacheTag } from 'next/cache';

// File-level caching
'use cache'

export default async function Page() {
  cacheLife('hours');
  cacheTag('products');
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

### Cache Revalidation

```typescript
import { cacheTag, updateTag, revalidateTag } from 'next/cache';

async function getProduct(id: string) {
  'use cache'
  cacheTag(`product-${id}`)
  cacheLife('hours')
  return fetch(`/api/products/${id}`);
}

// In Server Action - immediate invalidation
async function updateProduct(id: string, formData: FormData) {
  'use server'
  await db.products.update(id, formData);
  updateTag(`product-${id}`); // Immediately invalidates and refreshes
}
```

### Migration from Next.js 15 Patterns

```typescript
// ❌ Next.js 15 (deprecated with cacheComponents)
export const dynamic = 'force-static';
export const revalidate = 3600;
export const fetchCache = 'force-cache';

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

---

## Async Dynamic APIs (Breaking Change)

All dynamic APIs must now be awaited in Next.js 16:

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

// Also applies to:
const cookieStore = await cookies();
const headersList = await headers();
const { isEnabled } = await draftMode();
```

---

## Image Optimization Patterns

### Next.js Image Component

> ⚠️ **Critical**: The `priority` prop only works correctly in **Server Components**.
> In Client Components, the preload tag ends up in `<body>` due to streaming.
> See "LCP Preload Pattern" section below for the correct approach.

```typescript
import Image from 'next/image';

// LCP Image in SERVER COMPONENT - priority works
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
  quality={85}
  sizes="100vw"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// LCP Image in CLIENT COMPONENT - DON'T use priority
// Instead, use loading="eager" + fetchPriority="high"
// And preload from layout.tsx (see below)
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  loading="eager"
  fetchPriority="high"
  sizes="100vw"
/>

// Standard Image (auto lazy-loaded)
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// Fill container (aspect ratio control)
<div className="relative aspect-video">
  <Image
    src="/video-poster.jpg"
    alt="Video"
    fill
    className="object-cover"
  />
</div>
```

### Next.js 16 Image Defaults

```typescript
// next.config.ts - New defaults in Next.js 16
const nextConfig = {
  images: {
    minimumCacheTTL: 14400,     // 4 hours (was 60 seconds)
    quality: [75],              // Coerced to single value
    // Required for localhost image sources
    dangerouslyAllowLocalIP: true,
  },
};

// Migration from images.domains (deprecated)
images: {
  // ❌ Deprecated
  domains: ['example.com'],
  
  // ✅ Use remotePatterns
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'example.com',
    },
  ],
}
```

### LCP Preload Pattern (Next.js App Router)

> **Why this is needed**: When your LCP image is in a Client Component or streamed component,
> the `priority` prop adds the preload to `<body>` instead of `<head>`. This pattern ensures
> proper `<head>` placement by preloading in `layout.tsx` which renders BEFORE children stream.

```typescript
// app/[...slug]/layout.tsx - PRELOAD HERE (renders before children)
import { getImageProps } from "next/image";
import { preload } from "react-dom";

export default async function Layout({ children, params }) {
  const resolvedParams = await params; // Next.js 16: await params
  const data = await fetchData(resolvedParams);
  const lcpImage = data.heroImageUrl;

  if (lcpImage) {
    // getImageProps returns the exact URLs Next.js Image will use
    const imageProps = getImageProps({
      src: lcpImage,
      width: 1200,
      height: 600,
      alt: "Hero",
    });

    preload(imageProps.props.src as string, {
      as: "image",
      fetchPriority: "high",
      imageSrcSet: imageProps.props.srcSet,
      imageSizes: imageProps.props.sizes,
    });
  }

  return <>{children}</>;
}

// components/Hero.tsx - RENDER WITHOUT priority
import Image from "next/image";

export function Hero({ imageUrl }: { imageUrl: string }) {
  return (
    <Image
      src={imageUrl}
      alt="Hero"
      width={1200}
      height={600}
      loading="eager"       // Prevents lazy loading
      fetchPriority="high"  // Browser prioritization hint
      // NO priority - preload is handled in layout.tsx
    />
  );
}
```

**Verify preload placement:**

> ⚠️ Use browser headers to avoid WAF/CDN blocks on production sites.

```bash
# Browser headers (required for CloudFront, Cloudflare, Vercel, etc.)
HEADERS='-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" -H "Accept: text/html"'

# Preload line should be BEFORE </head> line
eval curl -s $HEADERS "URL" | tr '>' '\n' | grep -n 'as="image"\|</head'

# Should output exactly 1 preload
eval curl -s $HEADERS "URL" | tr '>' '\n' | grep -c 'as="image"'

# If blocked (403/503), ask user for additional headers (auth, cookies, etc.)
```

### Standard HTML Images

```html
<!-- LCP Image -->
<img 
  src="/hero.jpg" 
  alt="Hero"
  width="1200" 
  height="600"
  fetchpriority="high"
  decoding="async"
/>

<!-- Lazy loaded image -->
<img 
  src="/photo.jpg" 
  alt="Photo"
  width="800" 
  height="600"
  loading="lazy"
  decoding="async"
/>

<!-- Responsive image -->
<picture>
  <source 
    media="(min-width: 1024px)" 
    srcset="/hero-lg.webp" 
    type="image/webp"
  />
  <source 
    media="(min-width: 768px)" 
    srcset="/hero-md.webp" 
    type="image/webp"
  />
  <source srcset="/hero-sm.webp" type="image/webp" />
  <img 
    src="/hero-sm.jpg" 
    alt="Hero"
    width="400" 
    height="300"
    fetchpriority="high"
  />
</picture>
```

---

## Script Loading Patterns

### Next.js Script Component

```typescript
import Script from 'next/script';

// After page interactive (default for most scripts)
<Script 
  src="https://example.com/script.js"
  strategy="afterInteractive"
/>

// After page load (analytics, tracking - RECOMMENDED for non-critical)
<Script 
  src="https://www.googletagmanager.com/gtag/js"
  strategy="lazyOnload"
/>

// Before page interactive (critical scripts only)
<Script 
  src="/critical-script.js"
  strategy="beforeInteractive"
/>

// Inline script with strategy
<Script id="analytics-init" strategy="lazyOnload">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
  `}
</Script>
```

### Third-Party Script Optimization

> **Key insight**: Third-party scripts (TrustedForm, CrazyEgg, FB Pixel) often block the main
> thread for 100-200ms each. Load them after user interaction or use `lazyOnload`.

```typescript
// Option 1: Load on user interaction (best for non-critical analytics)
useEffect(() => {
  const loadScript = () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.trustedform.com/trustedform.js';
    document.body.appendChild(script);
  };
  
  // Load after first scroll or click
  window.addEventListener('scroll', loadScript, { once: true });
  window.addEventListener('click', loadScript, { once: true });
  
  // Fallback: load after 5 seconds regardless
  const timer = setTimeout(loadScript, 5000);
  
  return () => {
    clearTimeout(timer);
    window.removeEventListener('scroll', loadScript);
    window.removeEventListener('click', loadScript);
  };
}, []);

// Option 2: Next.js Script with lazyOnload
<Script 
  src="https://script.crazyegg.com/pages/scripts/xxxx.js"
  strategy="lazyOnload"
/>
```

### Standard HTML Scripts

```html
<!-- Defer non-critical scripts -->
<script src="/app.js" defer></script>

<!-- Async for independent scripts -->
<script src="/analytics.js" async></script>

<!-- Module scripts (auto-deferred) -->
<script type="module" src="/modern-app.js"></script>
```

---

## Server/Client Component Architecture (Next.js)

> **Critical Pattern**: When a parent component has `"use client"`, ALL children become Client
> Components and lose Server Component benefits (including proper LCP preloading).

### Anti-Pattern: Client Component Parent

```typescript
// ❌ BAD: Parent is Client Component - ALL children become client
"use client";

export function CommunityHeader({ community }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <section>
      <Gallery images={community.images} />  {/* Now a Client Component! */}
      <LeadModal isOpen={isOpen} />
    </section>
  );
}
```

### Correct Pattern: Isolated Client Boundaries

```typescript
// ✅ GOOD: Server Component parent with isolated client children

// components/header/index.tsx (Server Component - no "use client")
export function CommunityHeader({ community }) {
  return (
    <section>
      <Breadcrumbs items={generateBreadcrumbs(community)} /> {/* Client - own boundary */}
      <Gallery images={community.images} />                   {/* Server Component ✅ */}
      <LeadModal />                                           {/* Client - own boundary */}
    </section>
  );
}

// components/header/lead-modal.tsx (Client Component - isolated)
"use client";

import dynamic from 'next/dynamic';

// Lazy load heavy modal content
const ModalContent = dynamic(() => import('./modal-content'), {
  ssr: false,
});

export default function LeadModal() {
  const [isOpen, setIsOpen] = useState(false);
  return isOpen ? <ModalContent onClose={() => setIsOpen(false)} /> : null;
}

// components/gallery/index.tsx (Server Component)
// NO "use client" - renders on server, LCP image benefits from preload
import Image from 'next/image';

export function Gallery({ images }) {
  return (
    <div>
      <Image 
        src={images[0]} 
        loading="eager"
        fetchPriority="high"
        // ... 
      />
      <GalleryInteractive images={images} />  {/* Client - for click handlers */}
    </div>
  );
}
```

---

## Code Splitting Patterns

### Next.js Dynamic Imports

```typescript
import dynamic from 'next/dynamic';

// Client-only component (no SSR)
const Chart = dynamic(() => import('@/components/Chart'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

// SSR-enabled lazy component
const Modal = dynamic(() => import('@/components/Modal'));

// Named export
const { Tab, TabPanel } = dynamic(() => 
  import('@/components/Tabs').then(mod => ({
    Tab: mod.Tab,
    TabPanel: mod.TabPanel,
  }))
);

// Conditional loading
const HeavyEditor = dynamic(
  () => import('@/components/HeavyEditor'),
  { 
    ssr: false,
    loading: () => <EditorPlaceholder />,
  }
);
```

### React Lazy/Suspense

```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

---

## Font Optimization Patterns

### Next.js Font

```typescript
// app/layout.tsx
import { Inter, Roboto_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto-mono',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

### Standard Font Loading

```html
<!-- Preconnect to font origin -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Preload critical font -->
<link 
  rel="preload" 
  href="/fonts/inter.woff2" 
  as="font" 
  type="font/woff2" 
  crossorigin
/>

<!-- Font-display swap -->
<style>
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/inter.woff2') format('woff2');
    font-display: swap;
  }
</style>
```

---

## React Compiler (Next.js 16)

React Compiler is now stable in Next.js 16, eliminating the need for manual memoization.

### Enabling React Compiler

```typescript
// next.config.ts
const nextConfig = {
  reactCompiler: true,
};
```

### What It Replaces

```typescript
// ❌ No longer needed with React Compiler
const memoizedValue = useMemo(() => computeExpensive(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);
const MemoizedComponent = memo(MyComponent);

// ✅ Just write normal code - compiler optimizes automatically
const value = computeExpensive(a, b);
const callback = () => doSomething(a, b);
function MyComponent() { ... }
```

### Performance Benefits

- Eliminates manual memoization errors (missing dependencies)
- Reduces bundle size (no memoization wrapper code)
- Automatically optimizes re-renders

---

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
      setShowDetails(true);
    })}>
      {isPending ? 'Loading...' : 'Show Details'}
    </button>
  );
}
```

### CLS Impact

View Transitions help prevent CLS by maintaining visual stability during navigation.

---

## Context Providers Pattern (Next.js 16)

> **Good to know:** Render providers as deep as possible in the tree to optimize static parts.

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
        <Providers>{children}</Providers>  {/* Wrap only children, NOT <html> */}
      </body>
    </html>
  );
}
```

---

## Route Handlers Caching (Next.js 16)

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

---

## proxy.ts (New File Convention)

New file convention for request proxying with Node.js runtime.

### middleware.ts vs proxy.ts

| Feature | middleware.ts | proxy.ts |
|---------|---------------|----------|
| Runtime | Edge Runtime | Node.js Runtime |
| Use Case | Auth, redirects | API proxying |
| Access | Limited APIs | Full Node.js APIs |

```typescript
// app/proxy.ts
import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  if (url.pathname.startsWith('/api/external')) {
    return NextResponse.rewrite(
      new URL('https://api.example.com' + url.pathname)
    );
  }
  
  return NextResponse.next();
}
```

---

## CLS Prevention Patterns

### Image Dimension Reservation

```typescript
// Always specify dimensions
<Image src="..." width={800} height={600} alt="..." />

// Or use aspect ratio
<div className="aspect-video relative">
  <Image src="..." fill alt="..." />
</div>
```

### Dynamic Content Reservation

```css
/* Reserve space for ads */
.ad-container {
  min-height: 250px;
}

/* Reserve space for embeds */
.embed-container {
  aspect-ratio: 16 / 9;
}

/* Skeleton for dynamic content */
.skeleton {
  min-height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Animation Best Practices

```css
/* Use transform instead of position/size changes */
.animate-good {
  transform: translateX(100px);
  opacity: 0.5;
}

/* Avoid layout-triggering properties */
.animate-bad {
  /* These cause layout shifts */
  left: 100px;
  width: 200px;
  height: 100px;
}
```

---

## Preloading Patterns

### Resource Hints

```html
<head>
  <!-- Preconnect to critical origins -->
  <link rel="preconnect" href="https://api.example.com" />
  <link rel="preconnect" href="https://cdn.example.com" crossorigin />
  
  <!-- DNS prefetch for less critical origins -->
  <link rel="dns-prefetch" href="https://analytics.example.com" />
  
  <!-- Preload LCP image -->
  <link 
    rel="preload" 
    href="/hero.webp" 
    as="image"
    type="image/webp"
    fetchpriority="high"
  />
  
  <!-- Preload critical font -->
  <link 
    rel="preload" 
    href="/fonts/inter.woff2" 
    as="font" 
    type="font/woff2"
    crossorigin
  />
  
  <!-- Preload critical script -->
  <link rel="modulepreload" href="/critical-module.js" />
</head>
```

---

## Verification Commands

```bash
# Full analysis
npx perf-check https://example.com --insights

# Mobile-specific
npx perf-check https://example.com --mobile --verbose

# CI mode with thresholds
npx perf-check https://example.com --ci

# JSON output for processing
npx perf-check https://example.com --json > report.json
```

---

## HTTP Request Patterns (curl with WAF/CDN support)

> **Important**: Production sites often have WAF (Web Application Firewall), CloudFront,
> Cloudflare, or Vercel Edge protection that blocks requests without proper browser headers.

### Standard curl with Browser Headers

```bash
# Define reusable headers (Chrome on macOS)
BROWSER_HEADERS=(
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
  -H "Accept-Language: en-US,en;q=0.5"
  -H "Accept-Encoding: gzip, deflate, br"
  -H "Connection: keep-alive"
  -H "Upgrade-Insecure-Requests: 1"
  -H "Sec-Fetch-Dest: document"
  -H "Sec-Fetch-Mode: navigate"
  -H "Sec-Fetch-Site: none"
  -H "Sec-Fetch-User: ?1"
)

# Fetch page with browser headers
curl -sL "${BROWSER_HEADERS[@]}" "https://example.com/page"

# Quick version (minimum headers that usually work)
curl -s "URL" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Accept: text/html"
```

### Handling Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 403 Forbidden | WAF blocking | Add browser headers, ask user for auth headers |
| 503 Service Unavailable | Rate limiting or bot protection | Wait, retry with headers, or ask user |
| 401 Unauthorized | Authentication required | Ask user for Cookie or Authorization header |
| 302/301 Redirect | Redirect not followed | Add `-L` flag to curl |
| Empty response | Blocked or wrong content-type | Check with `-v` flag, verify URL |

### Authenticated Requests

```bash
# With session cookie (get from browser DevTools)
curl -s "URL" \
  -H "User-Agent: Mozilla/5.0..." \
  -H "Cookie: session_id=abc123; auth_token=xyz789"

# With Bearer token
curl -s "URL" \
  -H "User-Agent: Mozilla/5.0..." \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# With custom WAF headers (ask user for these)
curl -s "URL" \
  -H "User-Agent: Mozilla/5.0..." \
  -H "X-Custom-Auth: value" \
  -H "X-Forwarded-For: client-ip"
```

### Agent Instructions for curl Errors

When running curl commands and encountering errors:

1. **First attempt**: Use standard browser headers (User-Agent + Accept)
2. **If 403/503**: Inform user the site has WAF/CDN protection, ask for:
   - Any required authentication headers
   - Session cookies from browser DevTools
   - Custom headers specific to their infrastructure
3. **If empty response**: Try with `-v` to see what's happening
4. **If redirect loop**: Verify the URL is correct, try with/without trailing slash
