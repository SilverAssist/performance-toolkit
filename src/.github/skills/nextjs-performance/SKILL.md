---
name: nextjs-performance
description: Optimize Next.js App Router performance including LCP, streaming, Server/Client Components architecture, and image preloading. Use when working on Next.js performance issues, LCP optimization, or component architecture decisions.
---

# Next.js App Router Performance Optimization

Expert knowledge for optimizing Next.js App Router applications, based on real-world optimizations achieving FCP -55%, SI -61%.

## When to Use This Skill

- Debugging LCP (Largest Contentful Paint) issues in Next.js
- Optimizing image loading and preloading
- Restructuring Server/Client Component architecture
- Implementing streaming-aware patterns
- Analyzing Core Web Vitals issues

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

### The Solution

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

### Key Principles

1. **Push `"use client"` to leaves** - Only add it to components that truly need interactivity
2. **Keep LCP elements in Server Components** - Images, hero sections, main content
3. **Pass Server data as props** - Don't fetch in Client Components what you can fetch on server
4. **Audit component trees** - Use React DevTools to verify component types

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

1. **Using `priority` in Client Components** - It won't work as expected
2. **Wrapping LCP images in Client Component parents** - Breaks preloading
3. **Not using `getImageProps()` for manual preloads** - Loses srcset/sizes optimization
4. **Forgetting `fetchPriority="high"` on the actual image** - Preload alone isn't enough
5. **Using `loading="lazy"` on LCP images** - Defeats the purpose

## Debugging Checklist

1. [ ] Is the LCP element in a Server Component?
2. [ ] Is `ReactDOM.preload()` called in `layout.tsx`?
3. [ ] Does the preload appear in `<head>` (not `<body>`)?
4. [ ] Does the image have `fetchPriority="high"`?
5. [ ] Is `loading="eager"` set (not lazy)?
6. [ ] Are parent components Server Components?

## Related Resources

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [React DOM preload](https://react.dev/reference/react-dom/preload)
- [Web Vitals LCP Guide](https://web.dev/lcp/)
