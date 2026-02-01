---
agent: agent
description: Complete performance audit implementing all key optimizations with progress tracking
---

# Performance Audit

Complete performance audit for **{url}** with full optimization implementation.

## Prerequisites

- Production or staging URL to analyze
- Access to the codebase
- Ability to test and deploy changes

## Overview

This audit follows a structured approach:
1. **Detect** - Understand project context
2. **Analyze** - Run comprehensive analysis
3. **Prioritize** - Rank opportunities by impact
4. **Implement** - Apply optimizations
5. **Verify** - Confirm improvements

## Steps

### Phase 1: Context Detection

**Step: Detect project stack**
- Reference: `.github/prompts/detect-context.prompt.md`

Gather:
- Framework and version
- CSS solution
- Image optimization setup
- Analytics scripts present

### Phase 2: Performance Analysis

**Step: Run comprehensive analysis**

```bash
# Mobile analysis (primary)
npx perf-check {url} --mobile --insights --output mobile-report.json

# Desktop analysis (secondary)
npx perf-check {url} --desktop --insights --output desktop-report.json
```

**Step: Review all metrics**

| Metric | Mobile | Desktop | Target |
|--------|--------|---------|--------|
| Performance Score | - | - | 90+ |
| LCP | - | - | < 2.5s |
| FCP | - | - | < 1.8s |
| CLS | - | - | < 0.1 |
| TBT | - | - | < 300ms |
| SI | - | - | < 3.4s |
| TTI | - | - | < 3.8s |

### Phase 3: Diagnostics Review

**Step: Document all diagnostics**

Create a prioritized list from the Diagnostics Table:

| # | Diagnostic | Savings | Severity | Priority |
|---|------------|---------|----------|----------|
| 1 | - | - | - | - |
| 2 | - | - | - | - |
| 3 | - | - | - | - |

### Phase 4: LCP Optimization

**Step: Implement LCP improvements**
- Reference: `.github/prompts/optimize-lcp.prompt.md`

Checklist:
- [ ] Identified LCP element
- [ ] Added priority/fetchpriority hint
- [ ] Added preload link if needed
- [ ] Reduced TTFB if > 600ms
- [ ] Eliminated render-blocking before LCP

### Phase 5: JavaScript Optimization

**Step: Optimize JavaScript bundle**
- Reference: `.github/prompts/optimize-bundle.prompt.md`

Checklist:
- [ ] Analyzed bundle composition
- [ ] Implemented code splitting for heavy components
- [ ] Replaced heavy dependencies
- [ ] Enabled tree shaking
- [ ] Deferred non-critical scripts

### Phase 6: Image Optimization

**Step: Optimize all images**

Checklist:
- [ ] LCP image optimized with priority
- [ ] All images use modern formats (WebP/AVIF)
- [ ] Images properly sized for display
- [ ] Offscreen images lazy loaded
- [ ] Responsive images implemented

**Framework implementation:**

For Next.js:
```typescript
import Image from 'next/image';

// LCP image
<Image src="..." priority sizes="100vw" />

// Other images (auto lazy-loaded)
<Image src="..." sizes="(max-width: 768px) 100vw, 50vw" />
```

### Phase 7: Third-Party Optimization

**Step: Manage third-party scripts**

Checklist:
- [ ] Audited all third-party scripts
- [ ] Removed unnecessary scripts
- [ ] Deferred analytics loading
- [ ] Used appropriate loading strategies

```typescript
// Next.js example
<Script src="analytics.js" strategy="lazyOnload" />
<Script src="chat-widget.js" strategy="afterInteractive" />
```

### Phase 8: CSS Optimization

**Step: Optimize CSS delivery**

Checklist:
- [ ] Critical CSS inlined or prioritized
- [ ] Unused CSS removed (Tailwind purge, etc.)
- [ ] Non-critical CSS deferred
- [ ] Font loading optimized

For Next.js with Tailwind:
```javascript
// tailwind.config.js - automatic purging in production
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
};
```

### Phase 9: Caching Strategy

**Step: Implement effective caching**

Checklist:
- [ ] Static assets have long cache TTL
- [ ] HTML has appropriate cache headers
- [ ] API responses cached when possible
- [ ] CDN configured for static assets

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/static/:path*',
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

### Phase 10: Verification

**Step: Re-run analysis**

```bash
npx perf-check {url} --mobile --insights --output mobile-after.json
npx perf-check {url} --desktop --insights --output desktop-after.json
```

**Step: Compare results**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Performance Score | - | - | - |
| LCP | - | - | - |
| FCP | - | - | - |
| CLS | - | - | - |
| TBT | - | - | - |

## Output

### Audit Summary

**Overall Status**: 🟢 Healthy / 🟡 Needs Attention / 🔴 Critical

**Score Improvement**: XX → XX (+XX points)

### Changes Implemented

| Phase | Change | File(s) | Impact |
|-------|--------|---------|--------|
| LCP | Added priority to hero image | `Hero.tsx` | -XXXms LCP |
| JS | Code split dashboard | `app/dashboard/page.tsx` | -XX KB |
| Images | Converted to WebP | Multiple | -XXX KB |
| 3rd Party | Deferred analytics | `layout.tsx` | -XXXms TBT |
| CSS | Enabled Tailwind purge | `tailwind.config.js` | -XX KB |

### Before/After Comparison

```
BEFORE                          AFTER
─────────────────────────────────────────────────────
Performance: XX/100             Performance: XX/100
LCP: X.Xs (Poor)                LCP: X.Xs (Good)
FCP: X.Xs                       FCP: X.Xs
CLS: 0.XX                       CLS: 0.XX
TBT: XXXms                      TBT: XXXms
Total JS: XXX KB                Total JS: XXX KB
Total Images: XXX KB            Total Images: XXX KB
```

### Remaining Issues

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| - | - | - |

### Monitoring Recommendations

1. **CI Integration**: Add performance checks to CI pipeline
   ```yaml
   - name: Performance Check
     run: npx perf-check ${{ env.PREVIEW_URL }} --ci
   ```

2. **Alerts**: Set up alerts for performance regressions

3. **Baseline**: Save current results as baseline for future comparisons

### Next Steps

- [ ] Deploy changes to staging
- [ ] Verify metrics in staging environment
- [ ] Deploy to production
- [ ] Monitor real user metrics (RUM)
- [ ] Schedule follow-up audit in 30 days

## Documentation

Update project documentation:
- [ ] Add performance section to README
- [ ] Document optimization patterns used
- [ ] Add performance budget to contributing guidelines
