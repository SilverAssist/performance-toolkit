/**
 * @silverassist/performance-toolkit
 *
 * Export pattern analyzer module for Next.js tree-shaking optimization.
 *
 * @module analyzer
 * @author Miguel Colmenares <me@miguelcolmenares.com>
 * @license PolyForm-Noncommercial-1.0.0
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

