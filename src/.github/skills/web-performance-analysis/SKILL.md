---
name: web-performance-analysis
description: Analyze and optimize web performance using PageSpeed Insights, Lighthouse, and Core Web Vitals. Use when debugging slow pages, optimizing LCP/FCP/CLS/TBT metrics, or conducting performance audits.
---

# Web Performance Analysis

Expert knowledge for analyzing and optimizing web performance using industry-standard tools and metrics.

## When to Use This Skill

- Running performance audits on websites
- Debugging Core Web Vitals issues (LCP, FCP, CLS, TBT)
- Analyzing PageSpeed Insights or Lighthouse reports
- Identifying performance bottlenecks
- Creating optimization action plans

## Core Web Vitals Reference

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **FCP** (First Contentful Paint) | ≤ 1.8s | 1.8s - 3.0s | > 3.0s |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| **TBT** (Total Blocking Time) | ≤ 200ms | 200ms - 600ms | > 600ms |
| **INP** (Interaction to Next Paint) | ≤ 200ms | 200ms - 500ms | > 500ms |

## HTTP Request Patterns for Performance Analysis

Production sites often have WAF (CloudFront, Cloudflare, Vercel) that block requests without browser headers.

### Always Use Browser Headers

```bash
curl -s "https://example.com" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Accept: text/html"
```

### If You Get 403/503 Errors

1. Inform the user the site has WAF/CDN protection
2. Ask for required headers (Cookie, Authorization, custom headers)
3. Retry with provided headers

### Common Required Headers

- `Cookie: session=...` - For authenticated pages
- `Authorization: Bearer ...` - For API-protected pages
- `X-Custom-Header: value` - For custom WAF rules

## Performance Analysis Commands

### Check Resource Loading Order

```bash
curl -s "URL" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Accept: text/html" \
  | tr '>' '\n' | grep -n 'preload\|</head'
```

### Check for Render-Blocking Resources

```bash
curl -s "URL" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Accept: text/html" \
  | grep -E '<script[^>]*src=|<link[^>]*stylesheet' | head -20
```

### Check Image Optimization

```bash
curl -s "URL" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Accept: text/html" \
  | grep -i '<img' | head -10
```

## LCP Optimization Checklist

1. **Identify the LCP element** - Usually hero image, main heading, or video
2. **Check preload placement** - Must be in `<head>`, not `<body>`
3. **Verify fetchPriority** - LCP images should have `fetchPriority="high"`
4. **Check loading attribute** - Should be `loading="eager"` not `lazy`
5. **Optimize image format** - Use WebP/AVIF with fallbacks
6. **Serve correct size** - Use srcset and sizes attributes
7. **Use CDN** - Serve from edge locations

## Common Performance Issues

### JavaScript Bundle Size
- **Symptom**: High TBT, slow TTI
- **Fix**: Code splitting, tree shaking, lazy loading

### Unoptimized Images
- **Symptom**: High LCP, slow page load
- **Fix**: Compression, modern formats, responsive images

### Render-Blocking CSS
- **Symptom**: High FCP, slow initial render
- **Fix**: Critical CSS inlining, async loading

### Layout Shifts
- **Symptom**: High CLS, content jumping
- **Fix**: Reserve space for images/ads, use aspect ratios

### Third-Party Scripts
- **Symptom**: High TBT, slow interactions
- **Fix**: Defer loading, use facade patterns, audit necessity

## PageSpeed Insights API Usage

```bash
# Basic analysis
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=URL&strategy=mobile"

# With API key (higher rate limits)
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=URL&strategy=mobile&key=API_KEY"
```

## Performance Budget Template

```json
{
  "performance": 90,
  "metrics": {
    "lcp": 2500,
    "fcp": 1800,
    "cls": 0.1,
    "tbt": 200
  },
  "resources": {
    "javascript": "200kb",
    "css": "50kb",
    "images": "500kb",
    "total": "1mb"
  }
}
```

## Debugging Workflow

1. **Gather baseline metrics** - Run PageSpeed Insights or Lighthouse
2. **Identify the bottleneck** - What's the biggest opportunity?
3. **Analyze root cause** - Why is this metric poor?
4. **Implement fix** - Make targeted changes
5. **Measure impact** - Re-run analysis
6. **Iterate** - Address next biggest issue

## Related Resources

- [Web Vitals](https://web.dev/vitals/)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
