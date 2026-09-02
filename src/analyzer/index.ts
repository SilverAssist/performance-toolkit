/**
 * @silverassist/performance-toolkit
 *
 * Export pattern analyzer module for Next.js tree-shaking optimization.
 *
 * @packageDocumentation
 */

export {
  ExportAnalyzer,
  createExportAnalyzer,
  analyzeExports,
} from "./analyzer";

export type {
  ExportType,
  ReExportType,
  FileExportInfo,
  ExportIssue,
  ExportAnalysisSummary,
  NextConfigAnalysis,
  ExportAnalysisResult,
  ExportRecommendation,
  ExportAnalyzerOptions,
} from "../types/analyzer";
