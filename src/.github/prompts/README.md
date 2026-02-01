# GitHub Copilot Prompts for Performance Analysis

Performance-focused prompts for GitHub Copilot agent workflows.

## Installation

The recommended way to install these prompts is using the included installer:

```bash
# Install prompts (creates symlink - auto-updates with package)
npx perf-prompts install

# Or copy files instead (if you want to customize)
npx perf-prompts install --copy

# Check installation status
npx perf-prompts status

# Remove prompts
npx perf-prompts uninstall
```

This creates a symlink at `.github/prompts/performance/` pointing to the package's prompts.
When you update `@silverassist/performance-toolkit`, the prompts update automatically.

## Overview

These prompts provide a structured workflow for analyzing web performance and implementing optimizations. They integrate with `@silverassist/performance-toolkit` to detect project context and provide framework-specific recommendations.

## Available Prompts

### Core Analysis Prompts

| Prompt | Description |
|--------|-------------|
| `analyze-performance` | Run performance analysis and generate actionable report |
| `performance-audit` | Complete multi-phase performance audit |

### Optimization Prompts

| Prompt | Description |
|--------|-------------|
| `optimize-lcp` | Focus on Largest Contentful Paint optimization |
| `optimize-bundle` | Analyze and optimize JavaScript bundle size |
| `nextjs-performance` | **Next.js App Router specific** - streaming-aware patterns, Server/Client architecture |

### Utility Prompts

| Prompt | Description |
|--------|-------------|
| `detect-context` | Detect project technology stack and architecture |

## Key Learnings Incorporated

These prompts include critical learnings from real-world optimizations:

### Next.js Streaming Behavior

> ⚠️ **Critical**: The `priority` prop on `<Image>` only works correctly in **Server Components**.
> In Client Components, the preload tag ends up in `<body>` instead of `<head>` due to streaming.

**Solution**: Use `ReactDOM.preload()` in `layout.tsx` (renders before children stream).

### Server/Client Component Architecture

```typescript
// ❌ WRONG: Parent is Client Component - ALL children become client
"use client";
export function Header() {
  return <Gallery />;  // Gallery loses Server Component benefits
}

// ✅ CORRECT: Server Component parent with isolated client children
export function Header() {
  return (
    <>
      <Gallery />        {/* Server Component - LCP benefits */}
      <LeadModal />      {/* Client - has own "use client" */}
    </>
  );
}
```

### Preload Verification

```bash
# Verify preload is in <head>, not <body>
# Use browser headers to avoid WAF/CDN blocks (CloudFront, Cloudflare, etc.)
curl -s "URL" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Accept: text/html" \
  | tr '>' '\n' | grep -n 'as="image"\|</head'
# Preload line should be < </head> line
# If 403/503 error: site has WAF - ask user for required headers
```

## Usage

1. Run performance analysis first:
   ```
   @workspace /analyze-performance https://your-site.com
   ```

2. Follow up with specific optimizations:
   ```
   @workspace /optimize-lcp
   ```

## Prompt Structure

Each prompt follows the standard format compatible with `@silverassist/copilot-prompts-kit`:

```markdown
---
agent: agent
description: Brief description
---

# Prompt Title

## Prerequisites
## Steps
## Output
```

## Integration

These prompts are designed to work with:
- `@silverassist/performance-toolkit` for analysis
- `@silverassist/copilot-prompts-kit` for workflow management
- Atlassian MCP for Jira integration (optional)
