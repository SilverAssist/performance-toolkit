/**
 * @silverassist/performance-toolkit
 *
 * Project context and framework detection type definitions.
 *
 * @module types/context
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

// =============================================================================
// Framework Detection Types
// =============================================================================

/**
 * Detected framework information
 */
export interface FrameworkInfo {
  /** Framework name */
  name:
    | "next"
    | "react"
    | "vue"
    | "nuxt"
    | "angular"
    | "svelte"
    | "astro"
    | "remix"
    | "gatsby"
    | "unknown";
  /** Framework version */
  version: string;
  /** Router type (for frameworks with multiple options) */
  routerType?: "app" | "pages" | "file-based" | "config-based";
  /** SSR/SSG capabilities */
  renderingMode?: "ssr" | "ssg" | "spa" | "hybrid" | "isr";
  /** Framework-specific features detected */
  features?: string[];
}

/**
 * Detected project technology stack
 */
export interface ProjectContext {
  /** Project name from package.json */
  name?: string;
  /** Framework detected */
  framework: FrameworkInfo | null;
  /** Package manager detected */
  packageManager: "npm" | "yarn" | "pnpm" | "bun" | null;
  /** Build tool detected */
  buildTool: "webpack" | "vite" | "turbopack" | "esbuild" | "rollup" | null;
  /** UI library detected */
  uiLibrary?: string;
  /** CSS solution detected */
  cssSolution?:
    | "tailwind"
    | "css-modules"
    | "styled-components"
    | "emotion"
    | "sass"
    | "vanilla"
    | null;
  /** TypeScript enabled */
  isTypeScript: boolean;
  /** Image optimization library */
  imageOptimization?: "next/image" | "sharp" | "imagemin" | "cloudinary" | null;
  /** Analytics/tracking libraries */
  analytics: string[];
  /** Third-party integrations detected */
  thirdPartyIntegrations: string[];
  /** Dependencies summary */
  dependencies: {
    production: string[];
    development: string[];
    total: number;
  };
}

/**
 * Framework-specific implementation note
 */
export interface FrameworkSpecificNote {
  /** Framework name */
  framework: string;
  /** Note content */
  note: string;
  /** Code example */
  codeExample?: string;
  /** Documentation link */
  docLink?: string;
}
