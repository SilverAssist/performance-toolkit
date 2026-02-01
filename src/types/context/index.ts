/**
 * Project Context Types
 *
 * Types for project detection and framework identification
 *
 * @packageDocumentation
 */

// =============================================================================
// Framework Detection Types
// =============================================================================

/**
 * Detected framework information
 */
export interface FrameworkInfo {
  /** Framework name (e.g., "Next.js", "React", "Vue") */
  name: string;
  /** Detected version */
  version?: string;
  /** Framework category */
  category: "meta-framework" | "spa" | "static" | "server" | "unknown";
  /** Whether framework supports SSR */
  supportsSSR: boolean;
  /** Whether framework supports SSG */
  supportsSSG: boolean;
  /** Whether framework has built-in image optimization */
  hasImageOptimization: boolean;
  /** Framework-specific performance features */
  performanceFeatures: string[];
}

/**
 * Complete project context for personalized recommendations
 */
export interface ProjectContext {
  /** Primary framework detected */
  framework?: FrameworkInfo;
  /** Additional libraries detected */
  libraries: string[];
  /** Build tools detected */
  buildTools: string[];
  /** Has TypeScript */
  hasTypeScript: boolean;
  /** Has ESLint */
  hasESLint: boolean;
  /** Has performance budget configuration */
  hasPerformanceBudget: boolean;
  /** Has bundle analyzer */
  hasBundleAnalyzer: boolean;
  /** Detected patterns (e.g., "monorepo", "microfrontend") */
  patterns: string[];
  /** Package manager used */
  packageManager: "npm" | "yarn" | "pnpm" | "bun" | "unknown";
  /** Node.js version (if detected) */
  nodeVersion?: string;
  /** Detected hosting/deployment platform */
  deploymentPlatform?: "vercel" | "netlify" | "cloudflare" | "aws" | "gcp" | "azure" | "unknown";
}

/**
 * Framework-specific note for reports
 */
export interface FrameworkSpecificNote {
  /** Note ID */
  id: string;
  /** Which frameworks this applies to */
  frameworks: string[];
  /** Short title */
  title: string;
  /** Detailed explanation */
  explanation: string;
  /** Related documentation URLs */
  docUrls?: string[];
  /** Code example if applicable */
  codeExample?: string;
}
