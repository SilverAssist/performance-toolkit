/**
 * @silverassist/performance-toolkit
 *
 * Bundle analysis type definitions.
 *
 * @module types/bundle
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

/**
 * Bundle analysis options
 */
export interface BundleAnalyzerOptions {
  /** Path to Next.js project directory */
  projectPath?: string;
  /** Whether to install @next/bundle-analyzer if missing */
  autoInstall?: boolean;
}

/**
 * Bundle analysis result
 */
export interface BundleAnalysisResult {
  /** Whether the analysis was successful */
  success: boolean;
  /** Path to the project analyzed */
  projectPath: string;
  /** Whether @next/bundle-analyzer was installed */
  installedAnalyzer: boolean;
  /** Generated report paths */
  reports?: {
    client?: string;
    server?: string;
    edge?: string;
  };
  /** Summary statistics */
  summary?: BundleSummary;
  /** Error message if analysis failed */
  error?: string;
}

/**
 * Bundle size summary
 *
 * Note: Current implementation provides placeholder recommendations.
 * Actual bundle size parsing from webpack stats will be added in a future version.
 */
export interface BundleSummary {
  /** Total client bundle size (parsed) */
  totalClientSize: number;
  /** Total server bundle size (parsed) */
  totalServerSize?: number;
  /** Largest chunks */
  largestChunks: ChunkInfo[];
  /** Largest dependencies */
  largestDependencies: DependencyInfo[];
  /** Potential optimizations */
  recommendations: string[];
}

/**
 * Information about a webpack chunk
 */
export interface ChunkInfo {
  /** Chunk name */
  name: string;
  /** Parsed size in bytes */
  size: number;
  /** Gzipped size in bytes (if available) */
  gzipSize?: number;
  /** Type of chunk (e.g., "entry", "async") */
  type?: string;
}

/**
 * Information about a dependency
 */
export interface DependencyInfo {
  /** Package name */
  name: string;
  /** Size in bytes */
  size: number;
  /** Percentage of total bundle */
  percentage: number;
  /** Whether it's a dev dependency */
  isDev?: boolean;
}
