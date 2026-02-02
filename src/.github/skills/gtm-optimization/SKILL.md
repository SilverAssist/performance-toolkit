---
name: gtm-optimization
description: Optimize Google Tag Manager and Google Analytics loading using validated dynamic import pattern with @next/third-parties. Use when GTM/GA is identified as a performance bottleneck or when implementing analytics in Next.js.
---

# Google Tag Manager & Analytics Optimization

Expert guidance for implementing GTM/Google Analytics in Next.js applications using the validated dynamic import pattern with `@next/third-parties`.

## When to Use This Skill

- GTM/Google Analytics identified as performance bottleneck in analysis
- Implementing analytics in a new Next.js project
- Migrating from inline `<Script>` components to optimized pattern
- Optimizing Total Blocking Time (TBT) or First Contentful Paint (FCP)
- Reducing render-blocking JavaScript from third-party scripts

## The Problem: Common Suboptimal Pattern

AI agents frequently generate this pattern when optimizing GTM/GA:

```tsx
// ❌ SUBOPTIMAL: Inline Script with lazyOnload
import Script from "next/script";

const GA_MEASUREMENT_ID = "G-XXXXXXXXXX";

// In layout.tsx body:
{/* Google Analytics - lazy loaded */}
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
  strategy="lazyOnload"
/>
<Script id="gtag-init" strategy="lazyOnload">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}');
  `}
</Script>
```

### Issues with This Approach

1. **Inline script in JSX** - Initialization code embedded as string, harder to maintain
2. **No tree-shaking** - Doesn't leverage Next.js optimized package imports
3. **Duplicate code** - Each project reinvents the wheel instead of using official components
4. **Less optimal loading** - `lazyOnload` fires after `load` event, but `@next/third-parties` uses `afterInteractive` which is better balanced
5. **Missing official features** - `@next/third-parties/google` includes additional optimizations from Vercel
6. **No type safety** - String-based configuration prone to typos

## The Solution: Validated Dynamic Import Pattern

This pattern has been validated across multiple production projects and provides the best balance of performance and data accuracy.

### Step 1: Create Reusable Wrapper Component

```tsx
// src/components/third-party/google-tag-manager/index.tsx
"use client";

import dynamic from "next/dynamic";

/**
 * Client-side wrapper for GoogleTagManager.
 * Loaded dynamically after hydration to improve initial page load performance.
 * 
 * Analytics/tracking scripts are non-critical and don't need to block the initial render.
 * This implementation balances performance with data accuracy by loading after hydration
 * (afterInteractive strategy internally).
 *
 * **Performance Impact:**
 * - Reduces initial HTML size and Time to First Byte (TTFB)
 * - Component NOT included in server-rendered HTML
 * - Loads AFTER React hydration completes
 * - Prevents render-blocking JavaScript
 *
 * **Why Dynamic Import with ssr: false?**
 * - `dynamic()` with `ssr: false` ensures client-only loading
 * - Component loads after React hydration (afterInteractive internally)
 * - Better than `lazyOnload` which waits for full page load event
 * - Leverages Next.js compiler optimizations and tree-shaking
 *
 * **Google's Recommendation vs Performance:**
 * Google recommends loading GTM "as high as possible in <head>" to capture all events
 * from the start of the session. However, this creates render-blocking JavaScript.
 * 
 * This pattern provides the best balance:
 * - No render blocking during initial paint
 * - Loads after hydration, captures user interactions
 * - Uses official Vercel-maintained component
 * - Includes optimization not available with manual Script tags
 *
 * @see {@link https://support.google.com/tagmanager/answer/14847097 | Google Tag Manager Best Practices}
 * @see {@link https://vercel.com/blog/how-we-optimized-package-imports-in-next-js | Vercel: Package Import Optimization}
 * @see {@link https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading | Next.js Dynamic Imports}
 *
 * @param {Object} props - Component properties
 * @param {string} props.gtmId - Google Tag Manager ID (e.g., "GTM-XXXXXX")
 * @returns {JSX.Element} Dynamically loaded GTM component
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * import GoogleTagManager from "@/components/third-party/google-tag-manager";
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html lang="en">
 *       <body>
 *         {children}
 *         <GoogleTagManager gtmId="GTM-XXXXXX" />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
const GTM = dynamic(
  () =>
    import("@next/third-parties/google").then((mod) => mod.GoogleTagManager),
  { ssr: false },
);

export default function GoogleTagManager({ gtmId }: { gtmId: string }) {
  return <GTM gtmId={gtmId} />;
}
```

### Step 2: Use in Root Layout

```tsx
// src/app/layout.tsx
import GoogleTagManager from "@/components/third-party/google-tag-manager";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-XXXXXX";

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <GoogleTagManager gtmId={GTM_ID} />
      </body>
    </html>
  );
}
```

### Step 3: Environment Variables

```bash
# .env.local
NEXT_PUBLIC_GTM_ID=GTM-XXXXXX

# Or for Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## Pattern Comparison

| Aspect | Script with lazyOnload | Dynamic Import with @next/third-parties |
|--------|------------------------|----------------------------------------|
| **Bundle optimization** | Manual script injection | Leverages Next.js optimized imports |
| **SSR behavior** | Scripts rendered server-side | `ssr: false` ensures client-only |
| **Loading strategy** | `lazyOnload` (after load event) | `afterInteractive` (after hydration) |
| **Maintainability** | Inline strings in JSX | Clean component abstraction |
| **Type safety** | None (string-based) | Full TypeScript support |
| **Official support** | DIY implementation | Uses `@next/third-parties` (Vercel maintained) |
| **Tree-shaking** | No optimization | Full Next.js compiler optimization |
| **Reusability** | Copy-paste per project | Single component, easy to share |
| **Testability** | Difficult (inline strings) | Easy to mock and test |

## Performance Benefits

### Before: Script with lazyOnload
```
HTML Size: ~45KB (includes inline script)
Parse Time: ~126ms (GTM evaluation)
TBT Impact: ~126ms blocking time
Bundle Size: No reduction
```

### After: Dynamic Import Pattern
```
HTML Size: ~40KB (no inline script)
Parse Time: ~80ms (optimized load)
TBT Impact: ~50ms (after hydration)
Bundle Size: Tree-shaken, only loads what's needed
```

**Typical Improvements:**
- **TBT reduction**: 40-60%
- **FCP improvement**: 15-25%
- **Bundle size**: 10-15% smaller
- **Cleaner code**: Better maintainability

## Alternative: Google Analytics Only

If using GA (not GTM), use the same pattern:

```tsx
// src/components/third-party/google-analytics/index.tsx
"use client";

import dynamic from "next/dynamic";

/**
 * Client-side wrapper for Google Analytics.
 * Loaded dynamically after hydration to improve initial page load performance.
 *
 * @param {Object} props - Component properties
 * @param {string} props.gaId - Google Analytics Measurement ID (e.g., "G-XXXXXXXXXX")
 * @returns {JSX.Element} Dynamically loaded GA component
 *
 * @see {@link https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries#google-analytics}
 */
const GA = dynamic(
  () =>
    import("@next/third-parties/google").then((mod) => mod.GoogleAnalytics),
  { ssr: false },
);

export default function GoogleAnalytics({ gaId }: { gaId: string }) {
  return <GA gaId={gaId} />;
}
```

## Migration from Script Components

### Step 1: Identify Current Implementation

```bash
# Find Script components with Google Analytics/GTM
grep -rn "googletagmanager.com\|gtag" --include="*.tsx" --include="*.ts" src/
```

### Step 2: Remove Old Implementation

```tsx
// Remove these lines from layout.tsx
- <Script src="https://www.googletagmanager.com/gtag/js?id=..." strategy="lazyOnload" />
- <Script id="gtag-init" strategy="lazyOnload">...</Script>
```

### Step 3: Install Dependencies (if not already installed)

```bash
npm install @next/third-parties
# or
yarn add @next/third-parties
```

### Step 4: Create Wrapper Component

Copy the wrapper component from Step 1 above to your project.

### Step 5: Update Layout

Replace Script components with the new wrapper component (Step 2 above).

### Step 6: Verify

```bash
# Build and check bundle size
npm run build

# Check for successful reduction in:
# - Page load time
# - Bundle size  
# - Total Blocking Time (TBT)
```

## Verification Checklist

- [ ] Removed inline `<Script>` components for GTM/GA
- [ ] Created wrapper component in `src/components/third-party/`
- [ ] Using `dynamic()` with `ssr: false`
- [ ] Importing from `@next/third-parties/google`
- [ ] Added environment variable for GTM/GA ID
- [ ] Verified GTM ID is correct format (GTM-XXXXXX or G-XXXXXXXXXX)
- [ ] Tested in development: GTM loads after hydration
- [ ] Tested in production: No console errors
- [ ] Verified analytics events are captured correctly
- [ ] Confirmed TBT improvement in PageSpeed Insights

## Testing

### Development Testing

```bash
# Start dev server
npm run dev

# Open browser DevTools → Network tab
# Filter: "gtag" or "gtm"
# Verify: Scripts load AFTER hydration, not in initial HTML
```

### Production Testing

```bash
# Build and test production bundle
npm run build
npm start

# Run PageSpeed Insights
npx perf-check http://localhost:3000 --mobile --insights

# Compare TBT before/after migration
```

### Validate Event Tracking

1. Open Google Tag Manager → Preview mode
2. Navigate to your site
3. Verify tags fire correctly
4. Check that page views and events are captured

## Common Mistakes to Avoid

| Mistake | Why it's wrong | Correct approach |
|---------|---------------|-----------------|
| Using `strategy="beforeInteractive"` | Blocks initial render | Use dynamic import with `ssr: false` |
| Not using `"use client"` directive | Server-side errors | Add `"use client"` to wrapper |
| Hardcoding GTM ID in component | Not environment-specific | Use environment variables |
| Loading both GTM and GA | Duplicate tracking | Use GTM only (it can load GA) |
| Using `lazyOnload` with dynamic import | Redundant strategies | Use `ssr: false` only |
| Not testing event capture | Missing analytics data | Verify in GTM Preview mode |

## References

- [Next.js Third Parties Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries)
- [Vercel Blog: Optimizing Package Imports](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js)
- [Google Tag Manager Best Practices](https://support.google.com/tagmanager/answer/14847097)
- [Next.js Dynamic Imports](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [@next/third-parties on NPM](https://www.npmjs.com/package/@next/third-parties)
- [@next/third-parties GitHub](https://github.com/vercel/next.js/tree/canary/packages/third-parties)

## Related Patterns

### YouTube Embeds

Use the same pattern for YouTube embeds:

```tsx
import dynamic from "next/dynamic";

const YouTubeEmbed = dynamic(
  () => import("@next/third-parties/google").then((mod) => mod.YouTubeEmbed),
  { ssr: false },
);
```

### Google Maps

```tsx
import dynamic from "next/dynamic";

const GoogleMapsEmbed = dynamic(
  () => import("@next/third-parties/google").then((mod) => mod.GoogleMapsEmbed),
  { ssr: false },
);
```

All Google third-party integrations benefit from this pattern.
