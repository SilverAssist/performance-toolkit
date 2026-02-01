/**
 * @silverassist/performance-toolkit
 *
 * Project context detector for analyzing technology stack and patterns.
 *
 * @module context
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

import type { FrameworkInfo, ProjectContext } from "../types";

/**
 * Project context detector for analyzing user's technology stack
 */
export class ProjectContextDetector {
  private packageJson: PackageJson | null = null;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Detects the complete project context
   */
  async detect(): Promise<ProjectContext> {
    await this.loadPackageJson();

    const framework = this.detectFramework();
    const packageManager = this.detectPackageManager();
    const buildTool = this.detectBuildTool();
    const cssSolution = this.detectCSSSolution();
    const isTypeScript = this.detectTypeScript();
    const imageOptimization = this.detectImageOptimization();
    const analytics = this.detectAnalytics();
    const thirdPartyIntegrations = this.detectThirdPartyIntegrations();
    const uiLibrary = this.detectUILibrary();

    const allDeps = this.getAllDependencies();

    return {
      name: this.packageJson?.name,
      framework,
      packageManager,
      buildTool,
      uiLibrary,
      cssSolution,
      isTypeScript,
      imageOptimization,
      analytics,
      thirdPartyIntegrations,
      dependencies: {
        production: Object.keys(this.packageJson?.dependencies || {}),
        development: Object.keys(this.packageJson?.devDependencies || {}),
        total: allDeps.length,
      },
    };
  }

  /**
   * Loads and parses package.json
   */
  private async loadPackageJson(): Promise<void> {
    try {
      // Dynamic import for fs (works in both Node and edge environments)
      const fs = await import("fs");
      const path = await import("path");

      const packagePath = path.join(this.projectRoot, "package.json");

      if (fs.existsSync(packagePath)) {
        const content = fs.readFileSync(packagePath, "utf-8");
        this.packageJson = JSON.parse(content) as PackageJson;
      }
    } catch {
      // Package.json not found or invalid - continue with null
      this.packageJson = null;
    }
  }

  /**
   * Detects the main framework being used
   */
  private detectFramework(): FrameworkInfo | null {
    if (!this.packageJson) return null;

    // Next.js detection
    if (this.hasDependency("next")) {
      return this.detectNextJS();
    }

    // Nuxt detection
    if (this.hasDependency("nuxt") || this.hasDependency("nuxt3")) {
      return this.detectNuxt();
    }

    // Remix detection
    if (this.hasDependency("@remix-run/react")) {
      return this.detectRemix();
    }

    // Gatsby detection
    if (this.hasDependency("gatsby")) {
      return this.detectGatsby();
    }

    // Astro detection
    if (this.hasDependency("astro")) {
      return this.detectAstro();
    }

    // SvelteKit detection
    if (this.hasDependency("@sveltejs/kit")) {
      return {
        name: "svelte",
        version: this.getDependencyVersion("@sveltejs/kit") || "unknown",
        routerType: "file-based",
        renderingMode: "hybrid",
      };
    }

    // Vue detection (standalone)
    if (this.hasDependency("vue")) {
      return {
        name: "vue",
        version: this.getDependencyVersion("vue") || "unknown",
        routerType: this.hasDependency("vue-router")
          ? "config-based"
          : undefined,
        renderingMode: "spa",
      };
    }

    // Angular detection
    if (this.hasDependency("@angular/core")) {
      return {
        name: "angular",
        version: this.getDependencyVersion("@angular/core") || "unknown",
        routerType: "config-based",
        renderingMode: this.hasDependency("@angular/platform-server")
          ? "ssr"
          : "spa",
      };
    }

    // React detection (standalone - after checking for meta-frameworks)
    if (this.hasDependency("react")) {
      return {
        name: "react",
        version: this.getDependencyVersion("react") || "unknown",
        routerType: this.hasDependency("react-router-dom")
          ? "config-based"
          : undefined,
        renderingMode: "spa",
      };
    }

    return null;
  }

  /**
   * Detects Next.js specific configuration
   */
  private detectNextJS(): FrameworkInfo {
    const version = this.getDependencyVersion("next") || "unknown";
    const majorVersion = this.parseMajorVersion(version);

    // Detect features
    const features: string[] = [];

    if (
      this.hasDependency("next-auth") ||
      this.hasDependency("@auth/nextjs-provider")
    ) {
      features.push("auth");
    }
    if (this.hasDependency("@next/font") || this.hasDependency("next/font")) {
      features.push("font-optimization");
    }
    if (this.hasDependency("next-intl") || this.hasDependency("next-i18next")) {
      features.push("i18n");
    }
    if (
      this.hasDependency("next-mdx-remote") ||
      this.hasDependency("@next/mdx")
    ) {
      features.push("mdx");
    }

    // Determine router type (app router available since Next 13.4+)
    // This is a heuristic - actual detection would require file system check
    const routerType: "app" | "pages" = majorVersion >= 14 ? "app" : "pages";

    // Determine rendering mode
    let renderingMode: "ssr" | "ssg" | "hybrid" | "isr" = "hybrid";
    if (majorVersion >= 13) {
      renderingMode = "hybrid"; // App router supports all modes
    }

    return {
      name: "next",
      version,
      routerType,
      renderingMode,
      features: features.length > 0 ? features : undefined,
    };
  }

  /**
   * Detects Nuxt specific configuration
   */
  private detectNuxt(): FrameworkInfo {
    const version =
      this.getDependencyVersion("nuxt") ||
      this.getDependencyVersion("nuxt3") ||
      "unknown";

    return {
      name: "nuxt",
      version,
      routerType: "file-based",
      renderingMode: "hybrid",
    };
  }

  /**
   * Detects Remix specific configuration
   */
  private detectRemix(): FrameworkInfo {
    return {
      name: "remix",
      version: this.getDependencyVersion("@remix-run/react") || "unknown",
      routerType: "file-based",
      renderingMode: "ssr",
    };
  }

  /**
   * Detects Gatsby specific configuration
   */
  private detectGatsby(): FrameworkInfo {
    const features: string[] = [];

    if (this.hasDependency("gatsby-plugin-image")) {
      features.push("image-optimization");
    }
    if (
      this.hasDependency("gatsby-source-contentful") ||
      this.hasDependency("gatsby-source-sanity")
    ) {
      features.push("headless-cms");
    }

    return {
      name: "gatsby",
      version: this.getDependencyVersion("gatsby") || "unknown",
      routerType: "file-based",
      renderingMode: "ssg",
      features: features.length > 0 ? features : undefined,
    };
  }

  /**
   * Detects Astro specific configuration
   */
  private detectAstro(): FrameworkInfo {
    const features: string[] = [];

    if (this.hasDependency("@astrojs/react")) features.push("react");
    if (this.hasDependency("@astrojs/vue")) features.push("vue");
    if (this.hasDependency("@astrojs/svelte")) features.push("svelte");
    if (this.hasDependency("@astrojs/image"))
      features.push("image-optimization");

    return {
      name: "astro",
      version: this.getDependencyVersion("astro") || "unknown",
      routerType: "file-based",
      renderingMode: "hybrid",
      features: features.length > 0 ? features : undefined,
    };
  }

  /**
   * Detects package manager from lock files
   */
  private detectPackageManager(): ProjectContext["packageManager"] {
    // This would ideally check for lock files
    // For now, return a reasonable default
    if (this.packageJson?.packageManager) {
      const pm = this.packageJson.packageManager;
      if (pm.startsWith("pnpm")) return "pnpm";
      if (pm.startsWith("yarn")) return "yarn";
      if (pm.startsWith("bun")) return "bun";
      if (pm.startsWith("npm")) return "npm";
    }
    return "npm"; // Default assumption
  }

  /**
   * Detects build tool
   */
  private detectBuildTool(): ProjectContext["buildTool"] {
    // Turbopack (Next.js 13+)
    if (this.hasDependency("next")) {
      const version = this.getDependencyVersion("next");
      if (version && this.parseMajorVersion(version) >= 13) {
        // Could be turbopack, but webpack is still default
        // Would need next.config.js analysis
      }
    }

    if (this.hasDependency("vite")) return "vite";
    if (this.hasDependency("esbuild") && !this.hasDependency("vite"))
      return "esbuild";
    if (this.hasDependency("rollup") && !this.hasDependency("vite"))
      return "rollup";
    if (this.hasDependency("webpack")) return "webpack";

    // Next.js uses webpack by default
    if (this.hasDependency("next")) return "webpack";

    return null;
  }

  /**
   * Detects CSS solution
   */
  private detectCSSSolution(): ProjectContext["cssSolution"] {
    if (this.hasDependency("tailwindcss")) return "tailwind";
    if (this.hasDependency("styled-components")) return "styled-components";
    if (
      this.hasDependency("@emotion/react") ||
      this.hasDependency("@emotion/styled")
    )
      return "emotion";
    if (this.hasDependency("sass") || this.hasDependency("node-sass"))
      return "sass";

    // CSS Modules is built into most frameworks, hard to detect without file analysis
    return null;
  }

  /**
   * Detects if project uses TypeScript
   */
  private detectTypeScript(): boolean {
    return (
      this.hasDependency("typescript") ||
      this.hasDependency("@types/node") ||
      this.hasDependency("@types/react")
    );
  }

  /**
   * Detects image optimization library
   */
  private detectImageOptimization(): ProjectContext["imageOptimization"] {
    if (this.hasDependency("next")) return "next/image";
    if (this.hasDependency("sharp")) return "sharp";
    if (this.hasDependency("imagemin")) return "imagemin";
    if (this.hasDependency("cloudinary")) return "cloudinary";
    return null;
  }

  /**
   * Detects analytics libraries
   */
  private detectAnalytics(): string[] {
    const analytics: string[] = [];

    if (this.hasDependency("@vercel/analytics"))
      analytics.push("Vercel Analytics");
    if (
      this.hasDependency("@google-analytics/react-ga") ||
      this.hasDependency("react-ga") ||
      this.hasDependency("react-ga4")
    )
      analytics.push("Google Analytics");
    if (
      this.hasDependency("@segment/analytics-next") ||
      this.hasDependency("analytics-node")
    )
      analytics.push("Segment");
    if (
      this.hasDependency("mixpanel-browser") ||
      this.hasDependency("mixpanel")
    )
      analytics.push("Mixpanel");
    if (this.hasDependency("amplitude-js")) analytics.push("Amplitude");
    if (this.hasDependency("posthog-js") || this.hasDependency("posthog-node"))
      analytics.push("PostHog");
    if (this.hasDependency("@datadog/browser-rum"))
      analytics.push("Datadog RUM");
    if (
      this.hasDependency("@sentry/nextjs") ||
      this.hasDependency("@sentry/react")
    )
      analytics.push("Sentry");

    return analytics;
  }

  /**
   * Detects third-party integrations
   */
  private detectThirdPartyIntegrations(): string[] {
    const integrations: string[] = [];

    // Auth providers
    if (this.hasDependency("next-auth")) integrations.push("NextAuth");
    if (this.hasDependency("@auth0/nextjs-auth0")) integrations.push("Auth0");
    if (this.hasDependency("@clerk/nextjs")) integrations.push("Clerk");
    if (this.hasDependency("firebase")) integrations.push("Firebase");
    if (this.hasDependency("@supabase/supabase-js"))
      integrations.push("Supabase");

    // CMS
    if (this.hasDependency("@sanity/client")) integrations.push("Sanity");
    if (this.hasDependency("contentful")) integrations.push("Contentful");
    if (this.hasDependency("@prismic/client")) integrations.push("Prismic");
    if (this.hasDependency("@strapi/strapi")) integrations.push("Strapi");

    // E-commerce
    if (this.hasDependency("@shopify/shopify-api"))
      integrations.push("Shopify");
    if (this.hasDependency("@stripe/stripe-js")) integrations.push("Stripe");

    // Database/ORM
    if (this.hasDependency("@prisma/client")) integrations.push("Prisma");
    if (this.hasDependency("drizzle-orm")) integrations.push("Drizzle ORM");
    if (this.hasDependency("mongoose")) integrations.push("MongoDB/Mongoose");

    return integrations;
  }

  /**
   * Detects UI library
   */
  private detectUILibrary(): string | undefined {
    if (
      this.hasDependency("@radix-ui/react-dialog") ||
      this.hasDependency("@radix-ui/react-slot")
    )
      return "Radix UI";
    if (this.hasDependency("@chakra-ui/react")) return "Chakra UI";
    if (this.hasDependency("@mantine/core")) return "Mantine";
    if (this.hasDependency("@mui/material")) return "Material UI";
    if (this.hasDependency("antd")) return "Ant Design";
    if (this.hasDependency("@headlessui/react")) return "Headless UI";
    if (this.hasDependency("react-bootstrap")) return "React Bootstrap";
    return undefined;
  }

  // =========================================================================
  // Helper methods
  // =========================================================================

  /**
   * Checks if a dependency exists
   */
  private hasDependency(name: string): boolean {
    if (!this.packageJson) return false;
    return !!(
      this.packageJson.dependencies?.[name] ||
      this.packageJson.devDependencies?.[name] ||
      this.packageJson.peerDependencies?.[name]
    );
  }

  /**
   * Gets version of a dependency
   */
  private getDependencyVersion(name: string): string | undefined {
    if (!this.packageJson) return undefined;
    return (
      this.packageJson.dependencies?.[name] ||
      this.packageJson.devDependencies?.[name] ||
      this.packageJson.peerDependencies?.[name]
    );
  }

  /**
   * Gets all dependencies as array
   */
  private getAllDependencies(): string[] {
    if (!this.packageJson) return [];
    return [
      ...Object.keys(this.packageJson.dependencies || {}),
      ...Object.keys(this.packageJson.devDependencies || {}),
    ];
  }

  /**
   * Parses major version from semver string
   */
  private parseMajorVersion(version: string): number {
    const clean = version.replace(/^[\^~]/, "");
    const major = clean.split(".")[0];
    return parseInt(major, 10) || 0;
  }
}

/**
 * Package.json structure (simplified)
 */
interface PackageJson {
  name?: string;
  version?: string;
  packageManager?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

/**
 * Creates a project context detector instance
 * @param projectRoot - Root directory of the project
 * @returns ProjectContextDetector instance
 */
export function createContextDetector(
  projectRoot?: string,
): ProjectContextDetector {
  return new ProjectContextDetector(projectRoot);
}

/**
 * Quick function to detect project context
 * @param projectRoot - Root directory of the project
 * @returns Detected project context
 */
export async function detectProjectContext(
  projectRoot?: string,
): Promise<ProjectContext> {
  const detector = new ProjectContextDetector(projectRoot);
  return detector.detect();
}
