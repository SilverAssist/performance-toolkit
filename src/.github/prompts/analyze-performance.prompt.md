---
agent: agent
description: Analyze web performance and generate actionable optimization report with framework-specific recommendations
---

# Analyze Performance

Analyze **{url}** for performance issues and generate a comprehensive actionable report.

## Prerequisites

- URL to analyze (production or staging)
- Optional: Project root path for context detection

## Steps

### 1. Detect Project Context

First, understand the project's technology stack:

**Step: Read package.json**
1. Look for `package.json` in the workspace root
2. Identify the framework (Next.js, React, Vue, etc.)
3. Detect the version and router type (app/pages for Next.js)
4. Note CSS solution (Tailwind, styled-components, etc.)
5. List analytics and third-party integrations

**Step: Understand Architecture**
1. Check if using App Router or Pages Router (Next.js)
2. Identify rendering mode (SSR, SSG, ISR, SPA)
3. Note image optimization strategy (next/image, sharp, etc.)
4. Check for performance-related dependencies

### 2. Run Performance Analysis

**Step: Execute Analysis**
```bash
npx perf-check {url} --insights --json > perf-report.json
```

Or programmatically:
```typescript
import { analyzeUrl, detectProjectContext, generateActionableReport } from '@silverassist/performance-toolkit';

const result = await analyzeUrl('{url}', { strategy: 'mobile' });
const context = await detectProjectContext();
const report = generateActionableReport(result, context);
```

### 3. Interpret Results

**Step: Review Core Web Vitals**
1. Check LCP (Largest Contentful Paint) - target < 2.5s
2. Check FCP (First Contentful Paint) - target < 1.8s
3. Check CLS (Cumulative Layout Shift) - target < 0.1
4. Check TBT (Total Blocking Time) - target < 300ms

**Step: Analyze LCP Timing Breakdown**

The LCP breakdown reveals WHERE the problem is:

| Phase | Good | What it means |
|-------|------|---------------|
| TTFB | < 600ms | Server response time - consider caching, CDN |
| Load Delay | < 200ms | Time before browser starts loading LCP resource |
| Load Duration | < 1000ms | Time to download the resource - image size, CDN speed |
| Render Delay | < 200ms | Time from load complete to paint - JS blocking |

Example analysis:
```
TTFB:             24ms    (0.3%)  ✅ Server is fast
Load Delay:       1627ms  (17.9%) ⚠️ Preload missing or late discovery
Load Duration:    4455ms  (49.1%) ❌ Image too large or slow CDN
Render Delay:     2970ms  (32.7%) ❌ Third-party scripts blocking
```

**Step: Analyze Diagnostics Table**
1. Review "Reduce unused JavaScript" - note savings
2. Review "Reduce unused CSS" - note savings
3. Review "Long main-thread tasks" - count and duration
4. Review "Third-party impact" - blocking time
5. Review "Render-blocking resources" - time impact

**Step: Identify LCP Element**
1. Note the LCP element type (image, text, video)
2. Check loading mechanism (eager, lazy, priority)
3. **For Next.js: Check if LCP component is Server or Client Component**
4. Review LCP timing breakdown (TTFB, load delay, render delay)

> ⚠️ **Next.js Critical Check**: If LCP is in a Client Component, verify preload is in `<head>`:
> ```bash
> # Use browser headers to avoid WAF/CDN blocks
> curl -s "URL" \
>   -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
>   -H "Accept: text/html" \
>   | tr '>' '\n' | grep -n 'as="image"\|</head'
> ```
> If preload line > </head> line, the preload is in `<body>` and ineffective.
> If you get 403/503 errors, the site has WAF protection - ask user for required headers.

### 4. Generate Key Opportunities

Based on the analysis, prioritize opportunities:

**Priority Assessment:**
- Critical: Score impact > 15 points or LCP > 4s
- High: Score impact 8-15 points or LCP 2.5-4s
- Medium: Score impact 3-8 points
- Low: Score impact < 3 points

**Framework-Specific Recommendations:**
- For Next.js: 
  - Use `ReactDOM.preload()` in `layout.tsx` for LCP images (NOT in child components)
  - Convert Client Component parents to Server Components where possible
  - Use `next/image` with `loading="eager"` + `fetchPriority="high"` (not `priority` in Client Components)
  - Use `next/script` with `strategy="lazyOnload"` for analytics
  - Use `next/dynamic` for heavy components
- For React: Consider React.lazy, Suspense boundaries
- For Vue: Consider async components, v-if for heavy sections

### 5. Create Action Plan

For each key opportunity, document:
1. What to fix
2. Why it matters (impact)
3. How to fix (with code examples)
4. Framework-specific implementation
5. Estimated effort

## Output

### Performance Summary

| Metric | Value | Rating | Target |
|--------|-------|--------|--------|
| Performance | XX/100 | 🟢/🟡/🔴 | 90+ |
| LCP | X.Xs | 🟢/🟡/🔴 | < 2.5s |
| FCP | X.Xs | 🟢/🟡/🔴 | < 1.8s |
| CLS | 0.XX | 🟢/🟡/🔴 | < 0.1 |
| TBT | XXXms | 🟢/🟡/🔴 | < 300ms |

### Diagnostics Table

| Issue | Est Savings | Severity |
|-------|-------------|----------|
| Reduce unused JavaScript | XXX KiB | 🔴 Critical |
| Reduce unused CSS | XX KiB | 🟡 Moderate |
| Long main-thread tasks | X tasks | 🟡 Moderate |
| ... | ... | ... |

### LCP Element Detection

- **Element**: `<tag>` (image/text/video)
- **Selector**: `CSS selector path`
- **URL**: `resource URL if applicable`
- **Loading**: eager/lazy/priority
- **Timing Breakdown**:
  - TTFB: XXXms
  - Load Delay: XXXms
  - Load Duration: XXXms
  - Render Delay: XXXms

### Key Opportunities (Ranked)

#### 1. 🔴 [Opportunity Title]
**Impact**: Critical | Est. improvement: +XX points

**Problem**: Description of the issue

**Solution**:
```typescript
// Code example
```

**Framework-specific** (Next.js/React/Vue):
```typescript
// Framework-specific code
```

---

### Recommended Next Steps

1. [ ] Immediate: [First action]
2. [ ] Soon: [Second action]
3. [ ] When possible: [Third action]

### Potential Savings

- **Time**: ~XXXms improvement
- **Size**: ~XXX KiB reduction
- **Score**: +XX points estimated

## Notes

- Run analysis on both mobile and desktop strategies
- Compare with previous baseline if available
- Consider field data (CrUX) vs lab data differences
