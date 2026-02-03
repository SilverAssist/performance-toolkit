/**
 * @silverassist/performance-toolkit
 *
 * Bundle analysis module for Next.js applications.
 * Provides integration with @next/bundle-analyzer for bundle size analysis.
 *
 * @module bundle
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
 */

export {
  BundleAnalyzerRunner,
  createBundleAnalyzer,
  analyzeBundle,
} from "./runner";

export type {
  BundleAnalyzerOptions,
  BundleAnalysisResult,
  BundleSummary,
  ChunkInfo,
  DependencyInfo,
} from "../types/bundle";
